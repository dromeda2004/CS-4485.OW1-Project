import React from "react";

export const Dashboard = () => {
  return (
    <div className="bg-[#517b9d] w-full min-w-[1214px] min-h-[755px] relative">
      <div className="absolute top-[34px] left-[304px] w-[646px] [font-family:'Inter-Bold',Helvetica] font-bold text-white text-[40px] text-center tracking-[0] leading-[normal] whitespace-nowrap">
        DISASTER TRACKER
      </div>

      <div className="absolute top-[228px] left-[59px] w-[708px] h-[483px] bg-white rounded-[15px]" />

      <div className="absolute top-[228px] left-[789px] w-[355px] h-[483px] bg-white rounded-[15px]" />

      <div className="absolute top-[313px] left-[812px] w-[307px] h-[147px] bg-white rounded-[15px] border-2 border-solid border-[#f0f4f6]" />

      <div className="absolute top-[475px] left-[814px] w-[307px] h-[131px] bg-white rounded-[15px] border-2 border-solid border-[#f0f4f6]" />

      <div className="absolute top-[251px] left-[818px] w-[307px] font-subheadings font-[number:var(--subheadings-font-weight)] text-[#19293c] text-[length:var(--subheadings-font-size)] tracking-[var(--subheadings-letter-spacing)] leading-[var(--subheadings-line-height)] [font-style:var(--subheadings-font-style)]">
        Breaking Posts
      </div>

      <div className="absolute top-[633px] left-[59px] w-[708px] h-[79px] bg-white rounded-[0px_0px_15px_15px]" />

      <div className="absolute top-[659px] left-[100px] w-[132px] font-inner font-[number:var(--inner-font-weight)] text-black text-[length:var(--inner-font-size)] tracking-[var(--inner-letter-spacing)] leading-[var(--inner-line-height)] [font-style:var(--inner-font-style)]">
        Heatmap
      </div>

      <div className="absolute top-[659px] left-[250px] w-[472px] h-[27px] rounded-[5px] bg-[linear-gradient(90deg,rgba(251,232,115,1)_0%,rgba(230,55,76,1)_100%)]" />

      <p className="absolute top-[365px] left-[837px] w-[274px] font-text font-[number:var(--text-font-weight)] text-transparent text-[length:var(--text-font-size)] tracking-[var(--text-letter-spacing)] leading-[var(--text-line-height)] [font-style:var(--text-font-style)]">
        <span className="text-black font-text [font-style:var(--text-font-style)] font-[number:var(--text-font-weight)] tracking-[var(--text-letter-spacing)] leading-[var(--text-line-height)] text-[length:var(--text-font-size)]">
          Massive flood in India displaces thousands of people.{" "}
        </span>

        <span className="text-[#2a457b] font-text [font-style:var(--text-font-style)] font-[number:var(--text-font-weight)] tracking-[var(--text-letter-spacing)] leading-[var(--text-line-height)] text-[length:var(--text-font-size)]">
          #IndiaFlood
        </span>
      </p>

      <p className="absolute top-[531px] left-[837px] w-[274px] font-text font-[number:var(--text-font-weight)] text-transparent text-[length:var(--text-font-size)] tracking-[var(--text-letter-spacing)] leading-[var(--text-line-height)] [font-style:var(--text-font-style)]">
        <span className="text-black font-text [font-style:var(--text-font-style)] font-[number:var(--text-font-weight)] tracking-[var(--text-letter-spacing)] leading-[var(--text-line-height)] text-[length:var(--text-font-size)]">
          Tropical cyclone causes severe damage in Phillipines.
        </span>

        <span className="text-[#2a457b] font-text [font-style:var(--text-font-style)] font-[number:var(--text-font-weight)] tracking-[var(--text-letter-spacing)] leading-[var(--text-line-height)] text-[length:var(--text-font-size)]">
          {" "}
          #Typhoon
        </span>
      </p>

      <div className="absolute top-[326px] left-[1081px] w-[38px] font-text font-[number:var(--text-font-weight)] text-[#5f5e63] text-[length:var(--text-font-size)] tracking-[var(--text-letter-spacing)] leading-[var(--text-line-height)] [font-style:var(--text-font-style)]">
        2h
      </div>

      <div className="absolute top-[488px] left-[1081px] w-[38px] font-text font-[number:var(--text-font-weight)] text-[#5f5e63] text-[length:var(--text-font-size)] tracking-[var(--text-letter-spacing)] leading-[var(--text-line-height)] [font-style:var(--text-font-style)]">
        5h
      </div>

      <div className="absolute top-[329px] left-[873px] w-[77px] font-users font-[number:var(--users-font-weight)] text-black text-[length:var(--users-font-size)] tracking-[var(--users-letter-spacing)] leading-[var(--users-line-height)] whitespace-nowrap [font-style:var(--users-font-style)]">
        User1
      </div>

      <div className="absolute top-[491px] left-[873px] w-[77px] font-users font-[number:var(--users-font-weight)] text-black text-[length:var(--users-font-size)] tracking-[var(--users-letter-spacing)] leading-[var(--users-line-height)] whitespace-nowrap [font-style:var(--users-font-style)]">
        User2
      </div>


      <div className="absolute top-[177px] left-[576px] w-64 h-5 bg-[#f2f2f2] rounded-[5px]" />
    </div>
  );
};

export default Dashboard;
