import axios from "axios";
import "dotenv/config";

export async function searchGoogleDetails(lat, lng, name) {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY;

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=200&keyword=${encodeURIComponent(
      name
    )}&key=${API_KEY}`;

    const res = await axios.get(url);
    const place = res.data.results?.[0];

    if (!place) return null;

    return {
      name: place.name,
      address: place.vicinity,
      photoRef: place.photos?.[0]?.photo_reference ?? null,
      types: place.types ?? [],
    };
  } catch (err) {
    console.error("Google Place Detail Error:", err);
    return null;
  }
}