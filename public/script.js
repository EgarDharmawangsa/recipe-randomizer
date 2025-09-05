const ingredients = document.getElementById("ingredients");
const difficulty = document.getElementById("difficulty");
const timeInput = document.getElementById("time");
const generate_recipe = document.getElementById("generate-recipe");
const recipe_card = document.getElementById("recipe-card");
const recipe_loading = document.getElementById("recipe-loading");
const recipe_text = document.getElementById("recipe-text");
const close_recipe = document.getElementById("close-recipe");

// Fungsi bantu: cari string pertama dalam object
function findFirstString(obj, maxNodes = 2000) {
  const queue = [obj];
  let nodes = 0;
  while (queue.length && nodes < maxNodes) {
    const cur = queue.shift();
    nodes++;
    if (cur == null) continue;
    if (typeof cur === "string") {
      if (cur.trim()) return cur;
      continue;
    }
    if (Array.isArray(cur)) {
      for (const item of cur) queue.push(item);
      continue;
    }
    if (typeof cur === "object") {
      const preferKeys = [
        "content",
        "text",
        "output_text",
        "message",
        "choices",
        "answer",
      ];
      for (const k of preferKeys) {
        if (k in cur) queue.push(cur[k]);
      }
      for (const k of Object.keys(cur)) {
        queue.push(cur[k]);
      }
    }
  }
  return null;
}

function extractText(responseObj) {
  if (responseObj == null) return "";
  if (typeof responseObj === "string") return responseObj;
  if (responseObj.output_text) return responseObj.output_text;
  if (responseObj.text) return responseObj.text;
  if (responseObj.answer) return responseObj.answer;
  if (responseObj.message) {
    if (typeof responseObj.message === "string") return responseObj.message;
    if (responseObj.message.content)
      return Array.isArray(responseObj.message.content)
        ? responseObj.message.content[0]
        : responseObj.message.content;
    if (responseObj.message.text) return responseObj.message.text;
  }
  if (Array.isArray(responseObj.choices) && responseObj.choices[0]) {
    const c = responseObj.choices[0];
    if (typeof c === "string") return c;
    if (c.text) return c.text;
    if (c.message) return c.message.content || c.message.text;
  }
  const found = findFirstString(responseObj);
  if (found) return found;
  return JSON.stringify(responseObj, null, 2);
}

generate_recipe.addEventListener("click", async () => {
  const ingredients_value = ingredients.value;
  const difficulty_value = difficulty.value;
  const time_value = timeInput.value;

  if (
    !ingredients_value.trim() ||
    !difficulty_value.trim() ||
    !time_value.trim()
  ) {
    alert("⚠️ Semua input wajib diisi!");
    return;
  }

  recipe_card.style.display = "block";
  recipe_loading.style.display = "block";
  recipe_text.innerHTML = "";
  close_recipe.style.display = "none";

  const message = `
Kamu adalah chef professional di Indonesia.

Input:
- Bahan-Bahan: ${ingredients_value}
- Tingkat Kesulitan: ${difficulty_value}
- Durasi: ${time_value} menit

Aturan:
1. Jika ada SATU SAJA bahan yang bukan termasuk bahan masakan (contoh: kayu, plastik, batu, kertas, besi, dll), 
   Jawab HANYA dengan teks berikut (tanpa tambahan apapun):
   Terdapat bahan masakan yang tidak valid.
2. Jika SEMUA bahan valid, buat resep sesuai bahan (jangan tambahkan bahan lain).
3. Output WAJIB Markdown dengan struktur rapi TANPA kalimat pembuka/penutup:

## Nama Hidangan
### Bahan-Bahan
- ...
### Langkah-Langkah
1. ...
`;

  try {
    const puterResponse = await puter.ai.chat(message, {
      model: "openrouter:meta-llama/llama-3.1-8b-instruct",
    });

    console.log("puter raw response:", puterResponse);
    let text = extractText(puterResponse);
    text = String(text);

    try {
      recipe_text.innerHTML = marked.parse(text);
    } catch (mErr) {
      console.error("marked parse error:", mErr);
      recipe_text.textContent = text;
    }

    recipe_loading.style.display = "none";
    close_recipe.style.display = "block";
  } catch (error) {
    console.error("chat error:", error);
    recipe_loading.style.display = "none";
    recipe_text.textContent =
      "❌ Terjadi kesalahan: " + (error?.message || String(error));
    close_recipe.style.display = "block";
  }
});

close_recipe.addEventListener("click", () => {
  recipe_card.style.display = "none";
  recipe_loading.style.display = "block";
  ingredients.value = "";
  difficulty.value = "easy";
  timeInput.value = "";
  close_recipe.style.display = "none";
  recipe_text.innerHTML = "";
});
