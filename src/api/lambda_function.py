import json
import requests
import os
import logging
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError
from math import radians, cos, sin, asin, sqrt

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
dynamodb_table = dynamodb.Table('DisasterHeatmapLocations')
disaster_posts_table = dynamodb.Table('DisasterPosts')
disaster_heatmap_archive_table = dynamodb.Table('DisasterHeatmapArchive')


logger = logging.getLogger()
logger.setLevel(logging.INFO)

status_check_path = '/status'
post_path = '/post'
posts_path = '/posts'
heatmap_path = '/heatmap'
search_location_path = '/search-location'
breaking_disaster_path = '/breaking-disaster'
top_posts_path = '/top-posts'
heatmap_archive_path = '/heatmap/archive'


OPENCAGE_KEY = os.environ['OPENCAGE_KEY']

MILE_RADIUS = 50
LAT_DEGREE = MILE_RADIUS / 69.0

def convert_decimal(obj):
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj

def haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    miles = 3956 * c
    return miles

def lambda_handler(event, context):
    print('Request event: ', event)
    response = None
    try:
        http_method = event.get('httpMethod')
        path = event.get('path')
        headers = event.get('headers', {}) or {}
        if http_method == 'GET' and path == status_check_path:
            response = build_response(200, 'Service is operational')
        elif http_method == 'GET' and path == post_path:
            post_id = event.get('queryStringParameters', {}).get('postID')
            response = get_post(post_id)
        elif http_method == 'GET' and path == posts_path:
            response = get_posts()
        elif http_method == 'POST' and path == post_path:
            response = save_post(json.loads(event['body']))
        elif http_method == 'PATCH' and path == post_path:
            body = json.loads(event['body'])
            response = modify_post(body['postId'], body['updateKey'], body['updateValue'])
        elif http_method == 'DELETE' and path == post_path:
            body = json.loads(event['body'])
            response = delete_post(body['postId'])
        elif http_method == 'GET' and path == heatmap_path:
            response = get_heatmap_elements()
        elif http_method == 'GET' and path == search_location_path:
            search_query = event.get('queryStringParameters', {}).get('search')
            response = search_location(search_query)
        elif http_method == 'GET' and path == breaking_disaster_path:
            response = get_latest_disasters()
        elif http_method == 'GET' and path == top_posts_path:
            location_name = event.get('queryStringParameters', {}).get('location_name')
            response = get_top_posts_by_location(location_name)
        elif http_method == 'GET' and path == heatmap_archive_path:
            snapshot_date = None
            if event.get('queryStringParameters'):
                snapshot_date = event['queryStringParameters'].get('snapshot_date')
            response = get_heatmap_archive_elements(snapshot_date)
        else:
            response = build_response(404, f'Call 404 Not Found Invalid: {http_method} : {path}')
    except Exception as e:
        print('Error:', e)
        response = build_response(400, f'Error processing request: {str(e)}')
    try:
        print('Response to return:', response)
    except Exception:
        pass
    return response

def get_post(post_id):
    try:
        response = dynamodb_table.get_item(Key={'postID': post_id})
        return build_response(200, response.get('Item'))
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

def get_posts():
    try:
        scan_params = {'TableName': dynamodb_table.name}
        return build_response(200, scan_dynamo_records(scan_params, []))
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

def scan_dynamo_records(scan_params, item_array):
    response = dynamodb_table.scan(**scan_params)
    item_array.extend(response.get('Items', []))
    if 'LastEvaluatedKey' in response:
        scan_params['ExclusiveStartKey'] = response['LastEvaluatedKey']
        return scan_dynamo_records(scan_params, item_array)
    else:
        return {'posts': item_array}

def save_post(request_body):
    try:
        dynamodb_table.put_item(Item=request_body)
        body = {'Operation': 'SAVE', 'Message': 'SUCCESS', 'Item': request_body}
        return build_response(200, body)
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

def modify_post(post_id, update_key, update_value):
    try:
        response = dynamodb_table.update_item(
            Key={'postID': post_id},
            UpdateExpression=f'SET {update_key} = :value',
            ExpressionAttributeValues={':value': update_value},
            ReturnValues='UPDATED_NEW'
        )
        body = {'Operation': 'UPDATE', 'Message': 'SUCCESS', 'UpdatedAttributes': response}
        return build_response(200, body)
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

def delete_post(post_id):
    try:
        response = dynamodb_table.delete_item(Key={'postid': post_id}, ReturnValues='ALL_OLD')
        body = {'Operation': 'DELETE', 'Message': 'SUCCESS', 'Item': response}
        return build_response(200, body)
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def build_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps(body, cls=DecimalEncoder)
    }

def get_heatmap_elements():
    response = dynamodb_table.scan()
    items = response.get('Items', [])
    heatmap_data = []
    for item in items:
        raw_lat = item.get('lat')
        raw_lon = item.get('lon')
        try:
            lat = float(raw_lat)
            lon = float(raw_lon)
        except (TypeError, ValueError):
            continue
        raw_avg = item.get('avg_score', 0) or 0
        raw_count = item.get('post_count', 0) or 0
        try:
            intensity = float(raw_avg) * float(raw_count)
        except (TypeError, ValueError):
            intensity = 0.0
        heatmap_data.append({
            'location_name': item.get('location_name', 'NULL'),
            'lat': lat,
            'lon': lon,
            'disaster_breakdown': convert_decimal(item.get('disaster_breakdown', {})),
            'intensity': intensity
        })
    return build_response(200, {'heatmap_locations': heatmap_data})

def search_location(search_string):
    if not search_string:
        return build_response(400, {"error": "Missing 'search_string' parameter"})
    if not OPENCAGE_KEY:
        return {"statusCode": 500, "body": json.dumps({"error": "Missing OpenCage API key in environment variables"})}
    url = "https://api.opencagedata.com/geocode/v1/json"
    params = {"q": search_string, "key": OPENCAGE_KEY, "limit": 1}
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        result = response.json()
        if not result['results']:
            return build_response(404, {"error": "Location not found"})
        location = result['results'][0]
        geometry = location['geometry']
        formatted_name = location['formatted']
        lat = float(geometry['lat'])
        lon = float(geometry['lng'])
        lat_min = lat - LAT_DEGREE
        lat_max = lat + LAT_DEGREE
        lon_degree = MILE_RADIUS / (69.172 * cos(radians(lat)))
        lon_min = lon - lon_degree
        lon_max = lon + lon_degree
        filter_expr = "#lat BETWEEN :lat_min AND :lat_max AND #lon BETWEEN :lon_min AND :lon_max"
        expr_attr_names = {"#lat": "lat", "#lon": "lon"}
        expr_attr_values = {
            ":lat_min": Decimal(str(lat_min)),
            ":lat_max": Decimal(str(lat_max)),
            ":lon_min": Decimal(str(lon_min)),
            ":lon_max": Decimal(str(lon_max))
        }
        items = scan_with_pagination_disaster_posts(filter_expr, expr_attr_names, expr_attr_values)
        nearby_records = []
        for item in items:
            item_lat = item.get('lat')
            item_lon = item.get('lon')
            if item_lat is None or item_lon is None:
                continue
            item_lat = float(item_lat)
            item_lon = float(item_lon)
            distance = haversine(lat, lon, item_lat, item_lon)
            if distance <= MILE_RADIUS:
                nearby_records.append(item)
        search_hit = {"location_name": formatted_name, "lat": lat, "lon": lon}
        return build_response(200, {'search-hit': search_hit, 'nearby-records': convert_decimal(nearby_records)})
    except ClientError as e:
        logger.error(f"DynamoDB ClientError: {e}")
        return build_response(500, {"error": e.response['Error']['Message']})
    except requests.RequestException as e:
        logger.error(f"OpenCage API request error: {e}")
        return build_response(500, {"error": str(e)})
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return build_response(500, {"error": str(e)})

def scan_with_pagination_disaster_posts(filter_expr, expr_attr_names, expr_attr_values):
    items = []
    exclusive_start_key = None
    while True:
        scan_kwargs = {
            'FilterExpression': filter_expr,
            'ExpressionAttributeNames': expr_attr_names,
            'ExpressionAttributeValues': expr_attr_values,
        }
        if exclusive_start_key:
            scan_kwargs['ExclusiveStartKey'] = exclusive_start_key
        response = disaster_posts_table.scan(**scan_kwargs)
        items.extend(response.get('Items', []))
        exclusive_start_key = response.get('LastEvaluatedKey')
        if not exclusive_start_key:
            break
    return items

def get_latest_disasters():
    try:
        response = disaster_posts_table.scan()
        items = response.get('Items', [])
        sorted_items = sorted(items, key=lambda x: str(x.get('ingested_at') or x.get('created_at', '')), reverse=True)
        latest_items = sorted_items[:10]
        latest_items = convert_decimal(latest_items)
        return build_response(200, {'breaking_disasters': latest_items})
    except ClientError as e:
        logger.error(f"DynamoDB ClientError: {e}")
        return build_response(500, {"error": e.response['Error']['Message']})
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return build_response(500, {"error": str(e)})

def get_top_posts_by_location(location_name):
    if not location_name:
        return build_response(400, {"error": "Missing 'location_name' parameter"})

    try:
        logger.info(f"Fetching top posts for location: {location_name}")

        heatmap_res = dynamodb_table.get_item(Key={'location_name': location_name})
        heatmap_item = heatmap_res.get('Item')
        if not heatmap_item:
            return build_response(404, {"error": f"Location '{location_name}' not found"})

        top_post_ids_raw = heatmap_item.get('top_post_ids', [])
        logger.info(f"Raw top_post_ids: {top_post_ids_raw}")

        # Normalize possible DynamoDB "attribute value" format
        top_post_ids = []
        for entry in top_post_ids_raw:
            if isinstance(entry, dict) and "S" in entry:
                top_post_ids.append(entry["S"])
            elif isinstance(entry, str):
                top_post_ids.append(entry)

        if not top_post_ids:
            return build_response(200, {
                "location_name": location_name,
                "top_posts": [],
                "message": "No valid post IDs found"
            })

        top_posts = []
        for post_id in top_post_ids:
            try:
                res = disaster_posts_table.get_item(Key={'post_id': post_id})
                item = res.get('Item')
                if item:
                    top_posts.append(convert_decimal(item))
                else:
                    top_posts.append(f"Not found @ {post_id}")
                    logger.warning(f"Post ID {post_id} not found in DisasterPosts table.")
            except Exception as e:
                logger.warning(f"Failed to fetch post {post_id}: {str(e)}")

        return build_response(200, {
            "location_name": location_name,
            "top_posts": top_posts
        })

    except ClientError as e:
        logger.error(f"DynamoDB ClientError: {e}")
        return build_response(500, {"error": e.response['Error']['Message']})
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return build_response(500, {"error": str(e)})


def get_heatmap_archive_elements(snapshot_date=None):
    try:
        scan_kwargs = {}
        if snapshot_date:
            scan_kwargs['FilterExpression'] = 'snapshot_date = :snapshot_date'
            scan_kwargs['ExpressionAttributeValues'] = {
                ':snapshot_date': snapshot_date
            }

        response = disaster_heatmap_archive_table.scan(**scan_kwargs)
        items = response.get('Items', [])
        archive_data = []

        for item in items:
            raw_lat = item.get('lat')
            raw_lon = item.get('lon')
            try:
                lat = float(raw_lat)
                lon = float(raw_lon)
            except (TypeError, ValueError):
                continue

            raw_avg = item.get('avg_score', 0) or 0
            raw_count = item.get('post_count', 0) or 0
            try:
                intensity = float(raw_avg) * float(raw_count)
            except (TypeError, ValueError):
                intensity = 0.0

            archive_data.append({
                'location_name': item.get('location_name', 'NULL'),
                'lat': lat,
                'lon': lon,
                'snapshot_ts': item.get('snapshot_ts'),
                'snapshot_date': item.get('snapshot_date'),
                'archived_at': item.get('archived_at'),
                'updated_at': item.get('updated_at'),
                'disaster_breakdown': convert_decimal(item.get('disaster_breakdown', {})),
                'intensity': intensity,
                'avg_score': convert_decimal(raw_avg),
                'post_count': convert_decimal(raw_count),
                'top_post_ids': convert_decimal(item.get('top_post_ids', []))
            })

        return build_response(200, {
            'snapshot_date': snapshot_date or 'ALL',
            'heatmap_archive': archive_data
        })

    except ClientError as e:
        logger.error(f"DynamoDB ClientError: {e}")
        return build_response(500, {"error": e.response['Error']['Message']})
    except Exception as e:
        logger.error(f"Unexpected error in get_heatmap_archive_elements: {e}")
        return build_response(500, {"error": str(e)})
