const ingredients = document.getElementById("ingredients");
const difficulty = document.getElementById("difficulty");
const timeInput = document.getElementById("time");
const generate_recipe = document.getElementById("generate-recipe");
const recipe_card = document.getElementById("recipe-card");
const recipe_loading = document.getElementById("recipe-loading");
const recipe_text = document.getElementById("recipe-text");
const close_recipe = document.getElementById("close-recipe");

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
# PERAN
Kamu adalah chef profesional Indonesia.  
Tugas utama: validasi bahan masakan, lalu hasilkan salah satu dari dua kemungkinan output berikut:

1. Jika ada SATU SAJA bahan non-makanan → keluarkan persis:
   Terdapat bahan yang tidak termasuk bahan masakan.
   (Berhenti, jangan tambah teks lain)

2. Jika SEMUA bahan valid → buat resep sesuai format Markdown.

# INPUT
- Bahan: ${ingredients_value}
- Tingkat Kesulitan: ${difficulty_value}
- Durasi: ${time_value} menit

# DAFTAR MAKANAN
- Daging: sapi, ayam, kambing, domba, babi, bebek, dll.
- Ikan & seafood: ikan, udang, cumi, kerang, dll.
- Sayuran & buah: semua jenis umum
- Kacang, biji, serealia, beras, tepung, mie, sagu, tapioka
- Produk susu: susu, keju, mentega, margarin, krim, yogurt
- Bumbu dapur: garam, gula, lada, kunyit, jahe, bawang putih, bawang merah, bawang bombay, cabai, asam jawa, lengkuas, serai, daun salam, daun jeruk, santan, kecap manis, saus tiram, saus ikan, cuka, minyak goreng
- Telur, tahu, tempe
- Jamur yang bisa dimakan

# NON-MAKANAN
Semua bahan selain daftar di atas (contoh: sabun, deterjen, plastik, kertas, batu, kapur, cat, lem, bensin, kosmetik, obat, tumbuhan beracun, dll).

# FORMAT OUTPUT (untuk resep valid)
## Nama Hidangan
### Bahan-Bahan
- [jumlah] [bahan]
- ...

### Langkah-Langkah
1. [≤ 20 kata]
2. ...
(tahap terakhir akhiri dengan penyajian)
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
