(() => {
  const page = location.hostname;
  const report = {
    page,
    rowsRedacted: 0,
    textNodesSanitized: 0,
    accountImagesHidden: 0,
    calendarLabelsRedacted: 0,
    calendarEventsRedacted: 0,
    driveTextRedacted: 0,
    meetTextRedacted: 0,
    financeTextRedacted: 0,
  };

  const sanitizeTextNode = (node) => {
    const original = node.nodeValue || "";
    const sanitized = original
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "account@example.com")
      .replace(/@[A-Z0-9_]{3,}/gi, "@account")
      .replace(/\b\d{6,}\b/g, "000000");

    if (sanitized !== original) {
      node.nodeValue = sanitized;
      report.textNodesSanitized += 1;
    }
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) sanitizeTextNode(walker.currentNode);

  if (page === "mail.google.com") {
    document.querySelectorAll("tr.zA").forEach((row, index) => {
      const unread = row.classList.contains("zE");
      row.querySelectorAll(".yW span[email], .yW .yP, .yW .zF").forEach((element) => {
        element.textContent = unread ? "새 발신자" : "발신자";
      });
      row.querySelectorAll(".bog").forEach((element) => {
        element.textContent = `메일 제목 ${index + 1}`;
      });
      row.querySelectorAll(".y2").forEach((element) => {
        element.textContent = " - 메일 미리보기 내용";
      });
      row.querySelectorAll(".xW span").forEach((element) => {
        element.textContent = index < 3 ? "오후 12:34" : "8월 31일";
        element.removeAttribute("title");
      });
      row.querySelectorAll(".aZo, .aQH, .brc, .brg").forEach((element) => {
        element.textContent = "첨부파일.pdf";
        element.setAttribute("title", "첨부파일.pdf");
      });
      row.setAttribute("aria-label", unread ? "읽지 않은 메일" : "메일");
      report.rowsRedacted += 1;
    });

    const inboxTabs = Array.from(document.querySelectorAll('[role="tab"].aAy')).slice(0, 4);
    const tabLabels = ["기본", "프로모션", "소셜", "업데이트"];
    inboxTabs.forEach((tab, index) => {
      const label = tabLabels[index] || `카테고리 ${index + 1}`;
      tab.setAttribute("aria-label", label);
      tab.querySelectorAll(".aKp").forEach((element) => {
        element.textContent = label;
      });
      tab.querySelectorAll(".aKw").forEach((element) => {
        element.textContent = "";
      });
      tab.querySelectorAll(".bsU").forEach((element) => {
        element.textContent = "12";
      });
    });
  }

  if (page === "calendar.google.com") {
    const calendarLabels = ["내 기본 캘린더", "할 일", "생일", "대한민국 공휴일"];
    Array.from(document.querySelectorAll('input[type="checkbox"]'))
      .filter((input) => {
        const rect = input.parentElement?.getBoundingClientRect();
        return rect && rect.width > 0 && rect.height > 0;
      })
      .forEach((input, index) => {
        const row = input.closest(".nBzcnc");
        const label = row?.querySelector(".toUqff");
        const replacement = calendarLabels[index] || `캘린더 ${index + 1}`;
        if (label) label.textContent = replacement;
        if (label) report.calendarLabelsRedacted += 1;
        row?.querySelectorAll("[aria-label], [title]").forEach((element) => {
          if (element.hasAttribute("aria-label")) element.setAttribute("aria-label", replacement);
          if (element.hasAttribute("title")) element.setAttribute("title", replacement);
        });
      });

    document.querySelectorAll("[data-eventid], [data-eventchip]").forEach((event, index) => {
      event.querySelectorAll("*").forEach((element) => {
        if (element.children.length === 0 && (element.textContent || "").trim()) {
          element.textContent = `일정 ${index + 1}`;
        }
      });
      event.setAttribute("aria-label", `일정 ${index + 1}`);
      event.removeAttribute("title");
      report.calendarEventsRedacted += 1;
    });
  }

  if (page === "drive.google.com") {
    const main = document.querySelector('[role="main"], main');
    if (main) {
      let itemIndex = 0;
      const mainWalker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      while (mainWalker.nextNode()) {
        const node = mainWalker.currentNode;
        if (!(node.nodeValue || "").trim()) continue;
        const parent = node.parentElement;
        const size = Number.parseFloat(getComputedStyle(parent).fontSize || "14");
        const isHeading = /^H[1-6]$/.test(parent.tagName) || size >= 18;
        node.nodeValue = isHeading ? "추천 항목" : `파일 또는 폴더 ${++itemIndex}`;
        report.driveTextRedacted += 1;
      }

      main.querySelectorAll("img").forEach((image) => {
        image.style.visibility = "hidden";
      });
      main.querySelectorAll("*").forEach((element) => {
        const background = getComputedStyle(element).backgroundImage;
        if (background && background !== "none" && !background.includes("gstatic.com")) {
          element.style.backgroundImage = "none";
        }
        element.removeAttribute("title");
        if (element.hasAttribute("aria-label")) element.setAttribute("aria-label", "Drive 항목");
      });
    }
  }

  if (page === "meet.google.com") {
    const main = document.querySelector('[role="main"], main');
    if (main) {
      let itemIndex = 0;
      const meetWalker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      while (meetWalker.nextNode()) {
        const node = meetWalker.currentNode;
        const original = (node.nodeValue || "").trim();
        if (!original) continue;
        const parent = node.parentElement;
        const size = Number.parseFloat(getComputedStyle(parent).fontSize || "14");
        if (/^H[1-6]$/.test(parent.tagName) || size >= 24) node.nodeValue = "회의 상태";
        else if (parent.closest("button, [role=button]")) node.nodeValue = "Meet 작업";
        else if (/\d/.test(original)) node.nodeValue = "9월 1일";
        else node.nodeValue = `회의 정보 ${++itemIndex}`;
        report.meetTextRedacted += 1;
      }
      main.querySelectorAll("input, textarea").forEach((input) => {
        input.value = "";
        input.removeAttribute("value");
      });
      main.querySelectorAll("[aria-label], [title]").forEach((element) => {
        if (element.hasAttribute("aria-label")) element.setAttribute("aria-label", "Meet 항목");
        if (element.hasAttribute("title")) element.setAttribute("title", "Meet 항목");
      });
    }
  }

  if (page === "www.google.com" && location.pathname.startsWith("/finance")) {
    const main = document.querySelector('[role="main"], main');
    const replacementForFinance = (original, parent, index) => {
      const size = Number.parseFloat(getComputedStyle(parent).fontSize || "14");
      if (/%/.test(original)) return index % 2 === 0 ? "+1.24%" : "-0.42%";
      if (/[$₩€£]|\d/.test(original)) return index % 2 === 0 ? "$123.45" : "1,234.56";
      if (/^[A-Z]{2,8}$/.test(original)) return "GOOG";
      if (size >= 20 || /^H[1-6]$/.test(parent.tagName)) return "시장 요약";
      return `기업 또는 지수 ${index + 1}`;
    };
    if (main) {
      let labelIndex = 0;
      const financeWalker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      while (financeWalker.nextNode()) {
        const node = financeWalker.currentNode;
        const original = (node.nodeValue || "").trim();
        if (!original) continue;
        const parent = node.parentElement;
        if (parent.getBoundingClientRect().y < 80) continue;
        node.nodeValue = replacementForFinance(original, parent, labelIndex++);
        report.financeTextRedacted += 1;
      }

      main.querySelectorAll("img").forEach((image) => {
        image.style.visibility = "hidden";
      });
      main.querySelectorAll("[aria-label], [title]").forEach((element) => {
        if (element.hasAttribute("aria-label")) element.setAttribute("aria-label", "시장 데이터");
        if (element.hasAttribute("title")) element.setAttribute("title", "시장 데이터");
      });
    }

    let railIndex = 0;
    const railWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (railWalker.nextNode()) {
      const node = railWalker.currentNode;
      const original = (node.nodeValue || "").trim();
      const parent = node.parentElement;
      if (!original || !parent || main?.contains(parent)) continue;
      const rect = parent.getBoundingClientRect();
      const inSideRail = rect.y >= 80 && (rect.x < 300 || rect.x >= 1080);
      if (inSideRail) node.nodeValue = replacementForFinance(original, parent, railIndex++);
      if (inSideRail) report.financeTextRedacted += 1;
    }
  }

  document.querySelectorAll('img[alt*="Google 계정"], img[aria-label*="Google 계정"], a[href*="SignOutOptions"] img').forEach((image) => {
    image.style.visibility = "hidden";
    report.accountImagesHidden += 1;
  });

  const requiredChecks = {
    "mail.google.com": report.rowsRedacted > 0 && report.accountImagesHidden > 0,
    "calendar.google.com": report.calendarLabelsRedacted > 0 && report.accountImagesHidden > 0,
    "drive.google.com": report.driveTextRedacted > 0 && report.accountImagesHidden > 0,
    "meet.google.com": report.meetTextRedacted > 0 && report.accountImagesHidden > 0,
    "www.google.com": !location.pathname.startsWith("/finance") || (report.financeTextRedacted > 0 && report.accountImagesHidden > 0),
  };
  report.status = requiredChecks[page] === false ? "fail" : "pass";
  if (report.status !== "pass") {
    delete document.documentElement.dataset.captureRedacted;
    delete document.documentElement.dataset.captureAuthenticated;
    throw new Error(`Redaction coverage failed for ${page}: ${JSON.stringify(report)}`);
  }
  document.documentElement.dataset.captureRedacted = "true";
  document.documentElement.dataset.captureAuthenticated = "true";
  return JSON.stringify(report);
})();
