export default function LeftItem({ img, title, desc }) {
  return (
    <div className="left-item">
      <img src={img} alt={title} />
      <div className="left-item-content">
        <strong>{title}</strong>
        <div>{desc}</div>
      </div>
    </div>
  );
}
