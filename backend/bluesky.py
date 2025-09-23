from atproto import Client

client = Client()
client.login("csteam7.bsky.social", "Cspr2004")

post = client.post("Testing the bsky api with python!")
print(post.uri)
print(post.cid)