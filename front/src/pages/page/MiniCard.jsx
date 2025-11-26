export default function MiniCard({ image, title, description, rating }) {
  return (
    <div style={styles.card}>
      <img src={image} alt={title} style={styles.img} />
      <div style={styles.content}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.desc}>{description}</p>
        {rating && <span style={styles.rating}>⭐ {rating}</span>}
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: "150px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    cursor: "pointer"
  },
  img: {
    width: "100%",
    height: "100px",
    objectFit: "cover"
  },
  content: {
    padding: "10px"
  },
  title: {
    fontSize: "14px",
    fontWeight: "bold"
  },
  desc: {
    fontSize: "12px",
    color: "#555"
  },
  rating: {
    fontSize: "11px",
    color: "#777"
  }
};
