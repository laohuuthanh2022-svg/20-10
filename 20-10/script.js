/**
 * ============================================================================
 * DỰ ÁN: 20.10 — THE UNEXPECTED POSTCARD
 * Tệp xử lý tương tác, hiệu ứng nghệ thuật và nhạc nền Lo-Fi Web Audio API
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
   1. KHO DỮ LIỆU LỜI CHÚC NGẪU NHIÊN (BẠN CÓ THỂ SỬA HOẶC THÊM TẠI ĐÂY)
---------------------------------------------------------------------------- */
const RANDOM_WISHES_POOL = [
  "Chúc bạn hôm nay bước ra đường gặp toàn chuyện dễ thương, mở điện thoại thấy toàn tin vui!",
  "Mong mọi kế hoạch bạn đang ấp ủ đều chạy mượt như code không bug!",
  "Chúc bạn luôn giữ được sự hóm hỉnh, tự do và nguồn năng lượng tích cực của riêng mình.",
  "Chúc ví tiền của bạn luôn dày, tâm trạng luôn nhẹ và lịch trình luôn có chỗ cho những cuộc vui!",
  "Mong hôm nay không ai giao thêm việc khó, chỉ có người rủ đi ăn ngon.",
  "Chúc bạn luôn tìm thấy niềm vui trong những điều bình dị nhất mỗi ngày.",
  "20/10 chúc bạn: Ngủ đủ giấc, cười đủ nhiều, tiêu tiền không cần nghĩ ngợi!",
  "Chúc bạn luôn được là chính mình ở phiên bản thoải mái và hạnh phúc nhất."
];

/* ----------------------------------------------------------------------------
   2. BỘ PHÁT NHẠC LO-FI CHILL JAZZ (WEB AUDIO API + HỖ TRỢ FILE MP3 NẾU CÓ)
   - Không tự động phát khi mới vào trang.
   - Tạo hợp âm Electric Piano ấm áp (Fmaj7 - Em7 - Dm7 - Cmaj7).
---------------------------------------------------------------------------- */
class LofiMusicBox {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.loopTimer = null;
    this.stepIndex = 0;
    this.volume = 0.18; // Âm lượng mặc định vừa phải, dễ chịu (0.0 -> 1.0)
    this.audioElement = document.getElementById("customAudioFile");
    this.useExternalFile = false;

    // Tiến trình hợp âm Lo-Fi Jazz (Tần số Hz)
    this.chords = [
      { root: 174.61, notes: [261.63, 329.63, 349.23, 440.00], melody: 523.25 }, // Fmaj7
      { root: 164.81, notes: [246.94, 329.63, 392.00, 493.88], melody: 587.33 }, // Em7
      { root: 146.83, notes: [261.63, 293.66, 349.23, 440.00], melody: 659.25 }, // Dm7
      { root: 130.81, notes: [261.63, 329.63, 392.00, 493.88], melody: 523.25 }  // Cmaj7
    ];
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Phát một nốt nhạc Rhodes ấm áp
  playWarmNote(freq, duration, delay = 0, gainAmount = 0.05) {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(freq * 2, now);

      // Lọc âm trầm ấm kiểu Lo-Fi
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1100, now);

      const finalGain = gainAmount * (this.volume / 0.18);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(finalGain, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + duration + 0.05);
      subOsc.stop(now + duration + 0.05);
    } catch (e) {
      // Đảm bảo lỗi âm thanh không bao giờ ảnh hưởng giao diện
    }
  }

  // Phát tiếng chime nhẹ khi người dùng nhấn nút hoặc mở thư
  playUiChime() {
    if (!this.ctx) return;
    try {
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.playWarmNote(587.33, 0.35, 0, 0.03);
      this.playWarmNote(880.00, 0.45, 0.07, 0.03);
    } catch (e) {}
  }

  scheduleChordStep() {
    if (!this.isPlaying) return;
    const current = this.chords[this.stepIndex % this.chords.length];

    // Nốt Bass trầm
    this.playWarmNote(current.root, 2.4, 0, 0.06);

    // Rải hợp âm Electric Piano
    current.notes.forEach((noteFreq, idx) => {
      this.playWarmNote(noteFreq, 2.1, idx * 0.06, 0.035);
    });

    // Nốt giai điệu điểm xuyết ở giữa nhịp
    this.playWarmNote(current.melody, 1.2, 1.1, 0.028);
    this.playWarmNote(current.notes[2] * 2, 1.0, 1.7, 0.022);

    this.stepIndex++;
  }

  async toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      await this.start();
      return true;
    }
  }

  async start() {
    this.isPlaying = true;

    // Thử kiểm tra xem người dùng có chép file assets/music.mp3 vào không
    if (this.audioElement && this.audioElement.getAttribute("src")) {
      try {
        this.audioElement.volume = this.volume;
        await this.audioElement.play();
        this.useExternalFile = true;
        return;
      } catch (err) {
        // Nếu không có file mp3, tự động chuyển sang bộ tổng hợp Lo-Fi Web Audio API
        this.useExternalFile = false;
      }
    }

    this.initContext();
    this.scheduleChordStep();
    this.loopTimer = setInterval(() => {
      this.scheduleChordStep();
    }, 2400);
  }

  stop() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.audioElement && this.useExternalFile) {
      this.audioElement.pause();
    }
  }
}

/* ----------------------------------------------------------------------------
   3. KHỞI TẠO CÁC TƯƠNG TÁC TRÊN TRANG
---------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const musicBox = new LofiMusicBox();

  // Các phần tử DOM chính
  const musicToggleBtn = document.getElementById("musicToggleBtn");
  const musicLabel = document.getElementById("musicLabel");
  const openPostcardBtn = document.getElementById("openPostcardBtn");
  const journeyContainer = document.getElementById("journeyContainer");
  const sectionPostcard = document.getElementById("section-postcard");
  const sectionCover = document.getElementById("section-cover");

  const expandPostcardBtn = document.getElementById("expandPostcardBtn");
  const expandBtnText = document.getElementById("expandBtnText");
  const postcardSecretFold = document.getElementById("postcardSecretFold");

  const wishCards = document.querySelectorAll(".wish-card-wrap");
  const flipAllBtn = document.getElementById("flipAllBtn");
  const randomWishBtn = document.getElementById("randomWishBtn");
  const randomWishOutput = document.getElementById("randomWishOutput");

  const envelopeWrapper = document.getElementById("envelopeWrapper");
  const envelopeBox = document.getElementById("envelopeBox");
  const secretLetterPaper = document.getElementById("secretLetterPaper");
  const closeLetterBtn = document.getElementById("closeLetterBtn");

  const restartJourneyBtn = document.getElementById("restartJourneyBtn");
  const burstContainer = document.getElementById("burstContainer");
  const microToast = document.getElementById("microToast");
  const customCursor = document.getElementById("customCursor");

  let lastWishIndex = -1;
  let toastTimeout = null;

  /* --- Hàm tạo hiệu ứng hạt nghệ thuật bay ra tại tọa độ (x, y) --- */
  function createArtBurst(x, y, count = 14) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !burstContainer) return;

    const palette = ["#FF5A36", "#1B3B8B", "#F4C430", "#F7F3E9"];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");
      particle.className = "art-particle";
      const color = palette[i % palette.length];
      particle.style.backgroundColor = color;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;

      // Hình tròn hoặc hình vuông xoay ngẫu nhiên
      if (i % 2 === 0) {
        particle.style.borderRadius = "50%";
      }

      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5 - 0.25);
      const distance = 45 + Math.random() * 85;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = `${Math.floor(Math.random() * 260 - 130)}deg`;

      particle.style.setProperty("--tx", `${tx}px`);
      particle.style.setProperty("--ty", `${ty}px`);
      particle.style.setProperty("--rot", rot);

      burstContainer.appendChild(particle);
      setTimeout(() => {
        particle.remove();
      }, 960);
    }
  }

  /* --- Hàm hiển thị thông báo nhỏ (Toast) khi chạm vật thể trang trí --- */
  function showMicroToast(message) {
    if (!microToast) return;
    microToast.textContent = message;
    microToast.classList.add("is-visible");
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      microToast.classList.remove("is-visible");
    }, 3200);
  }

  /* --- 1. Nút Bật/Tắt Nhạc Nền --- */
  if (musicToggleBtn) {
    musicToggleBtn.addEventListener("click", async () => {
      const playing = await musicBox.toggle();
      musicToggleBtn.classList.toggle("is-playing", playing);
      musicToggleBtn.setAttribute("aria-pressed", String(playing));
      if (musicLabel) {
        musicLabel.textContent = playing ? "LO-FI: ON" : "LO-FI: OFF";
      }
    });
  }

  /* --- 2. Nút "Mở bưu thiếp" ở Màn hình 1 --- */
  if (openPostcardBtn && journeyContainer) {
    openPostcardBtn.addEventListener("click", (e) => {
      const rect = openPostcardBtn.getBoundingClientRect();
      createArtBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 18);
      musicBox.playUiChime();

      journeyContainer.classList.remove("is-locked");
      journeyContainer.classList.add("is-unlocked");

      // Kích hoạt quan sát cuộn và di chuyển mượt xuống Màn hình 2
      setTimeout(() => {
        observeSections();
        if (sectionPostcard) {
          sectionPostcard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 80);
    });
  }

  /* --- 3. Nút "Còn một thứ nữa…" mở rộng bưu thiếp chính (Màn hình 2) --- */
  if (expandPostcardBtn && postcardSecretFold) {
    expandPostcardBtn.addEventListener("click", (e) => {
      const isOpen = postcardSecretFold.classList.toggle("is-open");
      expandPostcardBtn.setAttribute("aria-expanded", String(isOpen));
      postcardSecretFold.setAttribute("aria-hidden", String(!isOpen));

      if (expandBtnText) {
        expandBtnText.textContent = isOpen ? "Thu gọn lời nhắn" : "Còn một thứ nữa…";
      }

      if (isOpen) {
        const rect = expandPostcardBtn.getBoundingClientRect();
        createArtBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
        musicBox.playUiChime();
      }
    });
  }

  /* --- 4. Lật từng thẻ lời chúc ở Màn hình 3 --- */
  wishCards.forEach((card) => {
    const toggleFlip = (e) => {
      card.classList.toggle("is-flipped");
      musicBox.playUiChime();
      if (e.clientX && e.clientY) {
        createArtBurst(e.clientX, e.clientY, 8);
      }
    };

    card.addEventListener("click", toggleFlip);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleFlip(e);
      }
    });
  });

  if (flipAllBtn) {
    let allFlipped = false;
    flipAllBtn.addEventListener("click", () => {
      allFlipped = !allFlipped;
      wishCards.forEach((card) => {
        card.classList.toggle("is-flipped", allFlipped);
      });
      flipAllBtn.textContent = allFlipped ? "Úp tất cả thẻ lại" : "Lật tất cả thẻ";
      musicBox.playUiChime();
    });
  }

  /* --- 5. Nút "Cho tui một lời chúc khác" --- */
  if (randomWishBtn && randomWishOutput) {
    randomWishBtn.addEventListener("click", () => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * RANDOM_WISHES_POOL.length);
      } while (nextIndex === lastWishIndex && RANDOM_WISHES_POOL.length > 1);

      lastWishIndex = nextIndex;

      randomWishOutput.style.opacity = "0";
      randomWishOutput.style.transform = "translateY(6px)";

      setTimeout(() => {
        randomWishOutput.textContent = `“${RANDOM_WISHES_POOL[nextIndex]}”`;
        randomWishOutput.style.opacity = "1";
        randomWishOutput.style.transform = "translateY(0)";
      }, 180);

      const rect = randomWishBtn.getBoundingClientRect();
      createArtBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
      musicBox.playUiChime();
    });
  }

  /* --- 6. Mở & Đóng Phong thư bí mật ở Màn hình 4 --- */
  function openEnvelope() {
    if (!envelopeWrapper) return;
    const isAlreadyOpen = envelopeWrapper.classList.contains("is-open");
    if (!isAlreadyOpen) {
      envelopeWrapper.classList.add("is-open");
      envelopeBox.setAttribute("aria-expanded", "true");
      secretLetterPaper.setAttribute("aria-hidden", "false");

      const rect = envelopeBox.getBoundingClientRect();
      createArtBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
      musicBox.playUiChime();
    }
  }

  function closeEnvelope(e) {
    if (e) e.stopPropagation();
    if (!envelopeWrapper) return;
    envelopeWrapper.classList.remove("is-open");
    envelopeBox.setAttribute("aria-expanded", "false");
    secretLetterPaper.setAttribute("aria-hidden", "true");
  }

  if (envelopeBox) {
    envelopeBox.addEventListener("click", openEnvelope);
    envelopeBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openEnvelope();
      }
    });
  }

  if (closeLetterBtn) {
    closeLetterBtn.addEventListener("click", closeEnvelope);
  }

  /* --- 7. Tương tác với các vật thể trang trí (Stickers, Hoa, Con tem) --- */
  const easterObjects = document.querySelectorAll("[data-easter]");
  easterObjects.forEach((obj) => {
    obj.addEventListener("click", (e) => {
      e.stopPropagation();
      const message = obj.getAttribute("data-easter");
      const rect = obj.getBoundingClientRect();
      createArtBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);
      showMicroToast(message);
      musicBox.playUiChime();
    });
  });

  /* --- 8. Nút "Quay lại từ đầu" ở Màn hình 5 --- */
  if (restartJourneyBtn) {
    restartJourneyBtn.addEventListener("click", () => {
      // Thu gọn bưu thiếp màn hình 2
      if (postcardSecretFold && expandPostcardBtn) {
        postcardSecretFold.classList.remove("is-open");
        expandPostcardBtn.setAttribute("aria-expanded", "false");
        if (expandBtnText) expandBtnText.textContent = "Còn một thứ nữa…";
      }

      // Úp lại các thẻ lời chúc
      wishCards.forEach((card) => card.classList.remove("is-flipped"));

      // Đóng lại phong thư bí mật
      closeEnvelope();

      // Hiệu ứng tung hạt chúc mừng và cuộn mượt lên bìa tạp chí
      const rect = restartJourneyBtn.getBoundingClientRect();
      createArtBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 18);
      musicBox.playUiChime();

      if (sectionCover) {
        sectionCover.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* --- 9. Hiệu ứng Parallax nhẹ theo chuột trên Laptop & Con trỏ nghệ thuật --- */
  const parallaxItems = document.querySelectorAll("[data-parallax]");
  window.addEventListener("mousemove", (e) => {
    if (customCursor) {
      customCursor.style.left = `${e.clientX}px`;
      customCursor.style.top = `${e.clientY}px`;
    }

    if (window.innerWidth < 960) return;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    parallaxItems.forEach((el) => {
      const speed = parseFloat(el.getAttribute("data-parallax")) || 0.02;
      const moveX = deltaX * speed;
      const moveY = deltaY * speed;
      el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    });
  });

  /* --- 10. Hiệu ứng xuất hiện mượt mà khi cuộn trang --- */
  function observeSections() {
    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    if (!("IntersectionObserver" in window)) {
      revealElements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((el) => observer.observe(el));
  }
});