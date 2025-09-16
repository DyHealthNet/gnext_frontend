export function compressChromosomes(chroms) {
  const nums = chroms.filter(c => /^\d+$/.test(c)).map(Number).sort((a,b) => a-b);
  const letters = chroms.filter(c => /\D/.test(c));

  if (nums.length === 0) {
    return letters.join(', ');
  }
  const ranges = [];
  let start = nums[0], end = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === end + 1) {
      end = nums[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = end = nums[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);

  return ranges.concat(letters).join(', ');
}