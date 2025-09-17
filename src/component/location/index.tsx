import { Map } from "./map"
import CarIcon from "../../icons/car-icon.svg?react"
import BusIcon from "../../icons/bus-icon.svg?react"
import { LazyDiv } from "../lazyDiv"
import { LOCATION, LOCATION_ADDRESS } from "../../const"

export const Location = () => {
  return (
    <>
      <LazyDiv className="card location">
        <h2 className="english">Location</h2>
        <div className="addr">
          {LOCATION}
          <div className="detail">{LOCATION_ADDRESS}</div>
        </div>
        <Map />
      </LazyDiv>
      <LazyDiv className="card location">
        <div className="location-info">
          <div className="transportation-icon-wrapper">
            <BusIcon className="transportation-icon" />
          </div>
          <div className="heading">대중교통</div>
          <div />
          <div className="content">
            * 지하철 이용시
            <br />
            지하철 4호선 <b>혜화역 하차 → 4번 출구</b>
            <br />
            - 셔틀버스 : 혜화역 4번 출구 T스토어 앞
                <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(예식에 한함)
            <br />- 혜화역 1번출구 → 7번 마을버스
                <br />&nbsp;&nbsp;&nbsp;(성균관대 정문하차)
            <br />- 도보이용시 : 8분거리
            <br />
          </div>
          <div />
          <div className="content">
            * 버스 이용 시
            <br />
            - <span class="bg-color-blue">간선</span>: 100, 102, 104, 107, 140, 143, 150, 151, 160, 162, 171, 172, 272, 301, 710
            <br />
            - <span class="bg-color-red">광역</span>: 1101, 7101
            <br />
            이하 위와 동일합니다.
          </div>
        </div>
        <div className="location-info">
          <div className="transportation-icon-wrapper">
            <CarIcon className="transportation-icon" />
          </div>
          <div className="heading">자가용</div>
          <div />
          <div className="content">
            - 네비게이션: <b>성균관컨벤션웨딩홀</b> 검색
            <br />
            - 주차장 안내 : 본관 주차장, 제1주차장, 성균관대학교 주차장
            <br />
            - 하객주차 2시간 무료입니다.
            <br />
          </div>
          <div />
        </div>
      </LazyDiv>
    </>
  )
}
