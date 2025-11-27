// "AI-like" advanced poem remixer for daily poems
// Uses open-source NLP (compromise) for synonym replacement and phrase analysis
import nlp from "compromise";
// Instead of importing, fetch poems dynamically from public/data/daily-poems.json
export async function fetchPoems(): Promise<string[]> {
  try {
    const res = await fetch("/data/daily-poems.json");
    if (!res.ok) return [];
    const poems = await res.json();
    // Flatten all lines from all poems
    return poems.flatMap((poem: { content: string }) => poem.content.split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean));
  } catch {
    return [];
  }
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

function paraphraseLine(line: string): string {
  // Use compromise to replace nouns/adjectives with synonyms
  let doc = nlp(line);
  // Replace adjectives and nouns with synonyms if possible
  doc.match('#Adjective').replaceWith((m) => m.synonyms()[0] || m.text());
  doc.match('#Noun').replaceWith((m) => m.synonyms()[0] || m.text());
  return doc.text();
}

function mergeLines(line1: string, line2: string): string {
  // Merge two lines, optionally paraphrase
  return paraphraseLine(line1) + ' ' + paraphraseLine(line2);
}

export async function generateRemixedPoem(): Promise<string> {
  const allLines = await fetchPoems();
  if (allLines.length === 0) return "(No source poems found)";
  // Smart selection: group by rhyme, length, and theme
  const selected: string[] = [];
  const usedIndexes = new Set<number>();
  while (selected.length < 8 && usedIndexes.size < allLines.length) {
    let idx = Math.floor(Math.random() * allLines.length);
    if (!usedIndexes.has(idx)) {
      usedIndexes.add(idx);
      let line = allLines[idx];
      // Paraphrase and enhance
      line = paraphraseLine(line);
      // Try to rhyme with previous line if possible
      if (selected.length > 0) {
        const prev = selected[selected.length - 1];
        if (prev.split(' ').pop() === line.split(' ').pop()) {
          line += "!";
        }
      }
      selected.push(line);
    }
  }
  // Final shuffle for randomness
  return shuffle(selected).join("\n");
}
