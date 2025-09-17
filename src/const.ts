import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import "dayjs/locale/ko"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale("ko")

export { dayjs }

export const WEDDING_DATE = dayjs.tz("2026-01-10 12:30", "Asia/Seoul")
export const HOLIDAYS = []

export const LOCATION = "성균관컨벤션웨딩홀"
export const LOCATION_ADDRESS = "서울특별시 종로구 성균관로 31, 성균관대학교 정문옆"

export const SHARE_ADDRESS = LOCATION
export const SHARE_ADDRESS_TITLE = LOCATION

export const WEDDING_HALL_POSITION = [126.996698, 37.585431]

export const NMAP_PLACE_ID = 11545666
export const KMAP_PLACE_ID = 913429074

export const BRIDE_FULLNAME = "정ㅇㅇ"
export const BRIDE_FIRSTNAME = "ㅇㅇ"
export const BRIDE_TITLE = "딸"
export const BRIDE_FATHER = "정ㅇㅇ"
export const BRIDE_MOTHER = "박ㅇㅇ"
export const BRIDE_INFO = [
  {
    relation: "신부",
    name: BRIDE_FULLNAME,
    phone: "010-0000-0000",
    account: "우리은행 0000000000000",
  },
  {
    relation: "신부 아버지",
    name: BRIDE_FATHER,
    phone: "010-0000-0000",
    account: "하나은행 00000000000",
  },
  {
    relation: "신부 어머니",
    name: BRIDE_MOTHER,
    phone: "010-0000-0000",
    account: "하나은행 00000000000000",
  },
]

export const GROOM_FULLNAME = "노ㅇㅇ"
export const GROOM_FIRSTNAME = "ㅇㅇ"
export const GROOM_TITLE = "아들"
export const GROOM_FATHER = "노ㅇㅇ"
export const GROOM_MOTHER = "채ㅇㅇ"
export const GROOM_INFO = [
  {
    relation: "신랑",
    name: GROOM_FULLNAME,
    phone: "010-0000-0000",
    account: "하나은행 00000000000000",
  },
  {
    relation: "신랑 아버지",
    name: GROOM_FATHER,
    phone: "010-0000-0000",
    account: "신한은행 000000000000",
  },
  {
    relation: "신랑 어머니",
    name: GROOM_MOTHER,
    phone: "010-0000-0000",
    account: "국민은행 000000000000",
  },
]
