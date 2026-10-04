import "../styles/coming-soon.scss";

export default function NotFound() {
  return (
    <div className="coming-page">
      <div className="coming-box">
        
        <div className="icon">
          <i className="fa-solid fa-rocket"></i>
        </div>

        <h1>Coming Soon</h1>

        <p>
          <i className="fa-solid fa-sparkles"></i> Yeh page abhi bana rahe hain
        </p>

        <a href="/" className="home-btn">
          <i className="fa-solid fa-arrow-left"></i> Home wapas jao
        </a>

      </div>
    </div>
  );
}