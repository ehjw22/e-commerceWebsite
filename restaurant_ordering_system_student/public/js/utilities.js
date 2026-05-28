export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

export function createStarRating(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="${i <= rating ? 'text-warning' : 'text-muted'}">★</span>`;
  }
  return stars + `<small class="text-muted">(${rating}/5)</small>`;
}