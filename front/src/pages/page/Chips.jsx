export default function Chips({ items, selected, onSelect }) {
  return (
    <div className="chips">
      {items.map((i) => (
        <button
          key={i}
          className={`chip ${selected === i ? "primary" : ""}`}
          onClick={() => onSelect && onSelect(i)}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
