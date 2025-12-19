import fetch from "node-fetch";

const url =
  "https://apis.data.go.kr/B551011/TourismResourceService/locationBasedList?serviceKey=31fcf908618ebb3c84e9cc232cddaa4aaabcaf784a867cd7915e903c19904254&pageNo=1&numOfRows=10&MobileOS=ETC&MobileApp=TripDiner&arrange=Q&listYN=Y&contentTypeId=39&areaCode=6&_type=json";

fetch(url)
  .then(res => res.text())
  .then(data => console.log("응답:", data))
  .catch(err => console.error("오류:", err));
