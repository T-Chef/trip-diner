import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.justLoggedIn) {
      toast.success("환영합니다! 😊");
    }
  }, [location.state]);

  return (
    <div style={{ padding: 30 }}>
      <h2>대시보드</h2>
      <p>여기가 로그인 후 들어오는 메인 페이지입니다.</p>
    </div>
  );
}
