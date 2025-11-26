export default function Card({ img, tag, title }) {
  return (
    <article className="card">
      <img src={img} alt={title} />
      <div className="body">
        <span className="tag">{tag}</span>
        <h3>{title}</h3>
      </div>
    </article>
  );
}
