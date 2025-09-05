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
 Anda adalah chef profesional berlisensi di Indonesia dengan keahlian kulinari Nusantara dan Internasional.  
 Tugas Anda: buat resep masakan hanya dari bahan yang diberikan user, tanpa menambahkan bahan lain.  

--------------------------------------------------
INPUT VARIABLES (akan diisi runtime)
- Bahan-Bahan: ${ingredients_value}
- Tingkat Kesulitan: ${difficulty_value}
- Durasi: ${time_value} menit
--------------------------------------------------

0. VALIDASI BAHAN
   - Lakukan langkah berikut secara berurutan:
     1. Kumpulkan semua item dalam "${ingredients_value}".
     2. Bandingkan dengan whitelist di atas.
     3. Buat daftar "bahan_non_pangan" (pisahkan koma).
     4. Jika bahan_non_pangan JUMLAHNYA ≥ 1:
        TULIS EXACT:
        ❌ {bahan_non_pangan} bukan termasuk bahan masakan.
        kemudian BERHENTI (tidak ada output lain).
     5. Jika bahan_non_pangan kosong, lanjutkan ke pembuatan resep.

1. ATURAN KERAS
   a. Jika ADA SATU saja item dalam “Bahan-Bahan” yang tidak termasuk pangan, langsung keluarkan output:
      ❌ {daftar bahan non-pangan} bukan termasuk bahan masakan.
      (tidak ada teks, heading, atau emoji lain setelahnya).
   b. Jika semua bahan valid, lanjutkan ke langkah 2.
   c. Jangan tambahkan bahan apapun di luar daftar input.
   d. Pastikan total waktu aktif & pasif ≤ ${time_value} menit dan sesuaikan teknik dengan tingkat kesulitan ${difficulty_value}.
   e. Gunakan bahasa Indonesia yang ramah dan jelas; hindari klaim medis.

2. OUTPUT FORMAT (WAJIB, jangan ubah)
   - Gunakan Markdown EXACT seperti template di bawah.
   - Tidak boleh ada kalimat pembuka, penutup, atau section tambahan.
   - Tidak boleh ada bullet nested, emoji selain “❌” pada penolakan, atau blockquote di luar template.
   - Takaran boleh ditulis perkiraan (secukupnya, 1 sdt, 200 ml, dll.) agar resep bisa dieksekusi.

--------------------------------------------------
TEMPLATE OUTPUT (isi tanda {...} secara otomatis)

## {Nama Hidangan Otomatis}
> Tingkat Kesulitan: ${difficulty_value} | Durasi: ${time_value} menit

### Bahan-Bahan
- [takaran] [nama bahan]
- [takaran] [nama bahan]
... (ulangi untuk setiap item input)

### Langkah-Langkah
1. [Instruksi singkat, maks 20 kata]
2. [Instruksi singkat, maks 20 kata]
... (nomor terakhir harus mencapai penyajian)

### Catatan
- Porsi untuk 2 orang.
- Total waktu memasak tidak melebihi ${time_value} menit.
--------------------------------------------------

3. CONTOH (untuk internal, tidak dicetak ke user)
   Input: Bahan-Bahan: ayam, santan, kunyit, garam, daun salam  
   Output:

   ## Ayam Santan Kunyit
   > Tingkat Kesulitan: Mudah | Durasi: 30 menit
   ### Bahan-Bahan
   - 250 g ayam, potong
   - 200 ml santan
   - 1 sdt kunyit bubuk
   - 1/2 sdt garam
   - 2 lembar daun salam
   ### Langkah-Langkah
   1. Panaskan 2 sdm minyak, tumis ayam bersama kunyit hingga berubah warna.
   2. Tuang santan, masukkan daun salam dan garam, masak api kecil 15 menit hingga bumbu meresap.
   3. Angkat dan sajikan selagi hangat.
   ### Catatan
   - Porsi untuk 2 orang.
   - Total waktu memasak tidak melebihi 30 menit.

--------------------------------------------------
PROSES SEKARANG:
1. Validasi bahan input.
2. Jika lolos, buat resep sesuai template.
3. Jika gagal, keluarkan penolakan eksak.
`;

  try {
    const puterResponse = await puter.ai.chat(message, {
      model: "openrouter:openai/gpt-4o",
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
