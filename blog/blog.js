"use strict";

const articlelist = document.querySelector(".articlelist");
const articlecount = document.querySelector(".articlecount");
const articleindex = document.querySelector(".articleindex");
const articleview = document.querySelector(".articleview");
const backbutton = document.querySelector(".backbutton");
const readingstate = document.querySelector(".readingstate");
const article = document.querySelector(".article");
const articletitle = document.querySelector(".articletitle");
const articlesummary = document.querySelector(".articlesummary");
const articledate = document.querySelector(".articledate");
const articlelabels = document.querySelector(".articlelabels");
const articlebody = document.querySelector(".articlebody");
const descriptionmeta = document.querySelector("meta[name=description]");

let articles = [];
let currentrequest = null;
let currentarticle = null;
let openedfromlist = false;

const dateformat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC"
});

function escapehtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("\"", "&quot;")
		.replaceAll("'", "&#39;");
}

function safeurl(value, image = false) {
	const source = String(value).trim();
	if (!source) return "";

	try {
		const parsed = new URL(source, window.location.href);
		const allowed = image ? ["http:", "https:"] : ["http:", "https:", "mailto:"];
		if (!allowed.includes(parsed.protocol)) return "";
		if (source.startsWith("/") || source.startsWith("./") || source.startsWith("../")) return source;
		return parsed.href;
	}
	catch {
		return "";
	}
}

function formatdate(value) {
	const date = new Date(`${value}T00:00:00Z`);
	return Number.isNaN(date.getTime()) ? value : dateformat.format(date);
}

function inlineformat(source) {
	const tokens = [];
	let value = escapehtml(source);

	function token(html) {
		const index = tokens.push(html) - 1;
		return `\u0000${index}\u0000`;
	}

	value = value.replace(/`([^`]+)`/g, (match, code) => token(`<code>${code}</code>`));
	value = value.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (match, alt, url, title) => {
		const cleanurl = safeurl(url, true);
		if (!cleanurl) return alt;
		const cleantitle = title ? ` title="${title}"` : "";
		return token(`<img src="${escapehtml(cleanurl)}" alt="${alt}" loading="lazy"${cleantitle}>`);
	});
	value = value.replace(/\[([^\]]+)]\(([^\s)]+)\)/g, (match, label, url) => {
		const cleanurl = safeurl(url);
		if (!cleanurl) return label;
		const external = /^https?:/i.test(cleanurl) ? " target=\"_blank\" rel=\"noopener noreferrer\"" : "";
		return token(`<a href="${escapehtml(cleanurl)}"${external}>${label}</a>`);
	});
	value = value.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
	value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
	value = value.replace(/__([^_]+)__/g, "<strong>$1</strong>");
	value = value.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
	value = value.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>");
	value = value.replace(/~~([^~]+)~~/g, "<del>$1</del>");
	value = value.replace(/\|\|([^|]+)\|\|/g, "<span class=\"spoiler\" tabindex=\"0\">$1</span>");
	value = value.replace(/\u0000(\d+)\u0000/g, (match, index) => tokens[Number(index)]);
	return value;
}

function parsetable(lines, start) {
	if (start + 1 >= lines.length) return null;
	if (!/^\s*\|?\s*:?-{3,}/.test(lines[start + 1])) return null;

	const rows = [];
	let index = start;
	while (index < lines.length && lines[index].includes("|")) {
		rows.push(lines[index].replace(/^\s*\||\|\s*$/g, "").split("|"));
		index++;
	}
	if (rows.length < 2) return null;

	const head = rows[0].map((cell) => `<th>${inlineformat(cell.trim())}</th>`).join("");
	const body = rows.slice(2).map((row) => {
		const cells = row.map((cell) => `<td>${inlineformat(cell.trim())}</td>`).join("");
		return `<tr>${cells}</tr>`;
	}).join("");
	return {html: `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`, next: index};
}

function parsemarkdown(source) {
	const lines = source.replace(/\r\n?/g, "\n").split("\n");
	const output = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim()) {
			index++;
			continue;
		}

		const fence = line.match(/^```([a-z0-9-]*)\s*$/i);
		if (fence) {
			const code = [];
			index++;
			while (index < lines.length && !/^```\s*$/.test(lines[index])) {
				code.push(lines[index]);
				index++;
			}
			if (index < lines.length) index++;
			const language = fence[1] ? ` class="language-${escapehtml(fence[1])}"` : "";
			output.push(`<pre><code${language}>${escapehtml(code.join("\n"))}</code></pre>`);
			continue;
		}

		const callout = line.match(/^:::\s*(note|tip|warning)(?:\s+(.+))?\s*$/i);
		if (callout) {
			const content = [];
			index++;
			while (index < lines.length && !/^:::\s*$/.test(lines[index])) {
				content.push(lines[index]);
				index++;
			}
			if (index < lines.length) index++;
			const label = callout[2] || callout[1];
			output.push(`<aside class="callout"><div class="callouttitle">${inlineformat(label)}</div>${parsemarkdown(content.join("\n"))}</aside>`);
			continue;
		}

		const table = parsetable(lines, index);
		if (table) {
			output.push(table.html);
			index = table.next;
			continue;
		}

		const heading = line.match(/^(#{1,3})\s+(.+)$/);
		if (heading) {
			const level = heading[1].length;
			output.push(`<h${level}>${inlineformat(heading[2])}</h${level}>`);
			index++;
			continue;
		}

		if (/^\s*(?:-{3,}|\*{3,})\s*$/.test(line)) {
			output.push("<hr>");
			index++;
			continue;
		}

		if (/^>\s?/.test(line)) {
			const quote = [];
			while (index < lines.length && /^>\s?/.test(lines[index])) {
				quote.push(lines[index].replace(/^>\s?/, ""));
				index++;
			}
			output.push(`<blockquote>${parsemarkdown(quote.join("\n"))}</blockquote>`);
			continue;
		}

		const list = line.match(/^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/);
		if (list) {
			const ordered = Boolean(list[2]);
			const items = [];
			const pattern = ordered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/;
			while (index < lines.length) {
				const item = lines[index].match(pattern);
				if (!item) break;
				items.push(`<li>${inlineformat(item[1])}</li>`);
				index++;
			}
			const tag = ordered ? "ol" : "ul";
			output.push(`<${tag}>${items.join("")}</${tag}>`);
			continue;
		}

		const paragraph = [line.trim()];
		index++;
		while (index < lines.length && lines[index].trim()) {
			if (/^(#{1,3})\s+|^```|^:::\s*(?:note|tip|warning)|^>\s?|^\s*(?:[-*+]\s+|\d+\.\s+)|^\s*(?:-{3,}|\*{3,})\s*$/.test(lines[index])) break;
			if (parsetable(lines, index)) break;
			paragraph.push(lines[index].trim());
			index++;
		}
		output.push(`<p>${inlineformat(paragraph.join(" "))}</p>`);
	}

	return output.join("\n");
}

function validatearticle(entry) {
	if (!entry || typeof entry !== "object") return null;
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug || "")) return null;
	if (typeof entry.title !== "string" || typeof entry.date !== "string") return null;
	return {
		slug: entry.slug,
		title: entry.title,
		date: entry.date,
		
		summary: typeof entry.summary === "string" ? entry.summary : "",
		thumbnail: safeurl(entry.thumbnail || "", true),
		thumbnailalt: typeof entry.thumbnailalt === "string" ? entry.thumbnailalt : "",
		tags: Array.isArray(entry.tags) ? entry.tags.filter((tag) => typeof tag === "string").slice(0, 5) : [],
		
		accent: entry.accent,
		foreground: entry.foreground,
		muted: entry.muted,
		font: entry.font,
		width: entry.width,
		crop: entry.crop
	};
}

function applytheme(entry) {
	const root = document.documentElement;
	const colors = ["accent", "foreground", "muted"];
	colors.forEach((key) => {
		if (/^#[0-9a-f]{6}$/i.test(entry[key] || "")) root.style.setProperty(`--${key}`, entry[key]);
		else root.style.removeProperty(`--${key}`);
	});

	const fonts = {
		chirp: "default",
		inter: "inter",
		gothic: "gothic",
		mono: "Consolas"
	};
	root.style.setProperty("--articlefont", `"${fonts[entry.font] || fonts.chirp}"`);
	root.style.setProperty("--readingwidth", /^(40|46|54|60)rem$/.test(entry.width || "") ? entry.width : "60rem");
}

function renderlist() {
	articlelist.replaceChildren();
	articles.forEach((entry) => {
		const link = document.createElement("a");
		link.className = "articlelink";
		link.href = `#${encodeURIComponent(entry.slug)}`;
		link.dataset.slug = entry.slug;

		const thumbnail = document.createElement("img");
		thumbnail.className = "articlethumb";
		thumbnail.src = entry.thumbnail;
		thumbnail.alt = entry.thumbnailalt;
		thumbnail.loading = "lazy";
		thumbnail.style.objectPosition = entry.crop || "center";

		const info = document.createElement("span");
		info.className = "articleinfo";
		const title = document.createElement("strong");
		title.textContent = entry.title;
		const summary = document.createElement("p");
		summary.textContent = entry.summary;
		summary.hidden = !entry.summary;
		const time = document.createElement("time");
		time.dateTime = entry.date;
		time.textContent = formatdate(entry.date);
		info.append(title, summary, time);
		link.append(thumbnail, info);
		link.addEventListener("click", (event) => {
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			openedfromlist = true;
		});
		articlelist.append(link);
	});
	articlecount.textContent = `${articles.length} ${articles.length === 1 ? "post" : "posts"}`;
}

function showerror(title, message) {
	articleindex.hidden = true;
	articleview.hidden = false;
	articleview.setAttribute("aria-busy", "false");
	article.hidden = true;
	readingstate.hidden = false;
	readingstate.className = "readingstate errorstate";
	readingstate.innerHTML = `<h1>${escapehtml(title)}</h1><p>${escapehtml(message)}</p>`;
}

function showindex() {
	if (currentrequest) currentrequest.abort();
	currentrequest = null;
	currentarticle = null;
	articleview.hidden = true;
	articleindex.hidden = false;
	document.title = "blog!!";
	document.documentElement.style.removeProperty("--accent");
	document.documentElement.style.removeProperty("--foreground");
	document.documentElement.style.removeProperty("--muted");
	document.documentElement.style.removeProperty("--articlefont");
	document.documentElement.style.removeProperty("--readingwidth");
	window.scrollTo(0, 0);
}

async function openarticle(slug) {
	const entry = articles.find((candidate) => candidate.slug === slug);
	if (!entry) {
		history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
		showindex();
		return;
	}
	if (currentarticle === entry.slug && !article.hidden) return;

	if (currentrequest) currentrequest.abort();
	currentrequest = new AbortController();
	articleindex.hidden = true;
	articleview.hidden = false;
	articleview.setAttribute("aria-busy", "true");
	article.hidden = true;
	readingstate.hidden = false;
	readingstate.className = "readingstate";
	readingstate.innerHTML = "<p>loading article..</p>";
	window.scrollTo(0, 0);

	try {
		const response = await fetch(`articles/${encodeURIComponent(entry.slug)}.md`, {
			signal: currentrequest.signal,
			cache: "no-cache"
		});
		if (!response.ok) throw new Error(`Article request returned ${response.status}.`);
		const markdown = await response.text();

		applytheme(entry);
		articletitle.textContent = entry.title;
		articlesummary.textContent = entry.summary;
		articlesummary.hidden = !entry.summary;
		articledate.dateTime = entry.date;
		articledate.textContent = formatdate(entry.date);
		articlelabels.replaceChildren(...entry.tags.map((tag) => {
			const label = document.createElement("span");
			label.className = "articlelabel";
			label.textContent = tag;
			return label;
		}));
		articlelabels.hidden = entry.tags.length === 0;
		articlebody.innerHTML = parsemarkdown(markdown);

		document.title = `${entry.title}`;
		descriptionmeta.content = entry.summary || `Read ${entry.title} on cv's blog.`;
		currentarticle = entry.slug;

		readingstate.hidden = true;
		article.hidden = false;
		articleview.setAttribute("aria-busy", "false");
	}
	catch (error) {
		if (error.name === "AbortError") return;
		showerror("article unavailable?!", error.message);
	}
}

function route() {
	let slug = "";
	try {
		slug = decodeURIComponent(window.location.hash.slice(1));
	}
	catch {
		history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
	}

	if (slug) openarticle(slug);
	else showindex();
}

async function start() {
	try {
		const response = await fetch("articles/index.json", {cache: "no-cache"});
		if (!response.ok) throw new Error(`article index returned ${response.status}..`);
		const data = await response.json();
		if (!Array.isArray(data)) throw new Error("article index is not a list?!");

		articles = data.map(validatearticle).filter(Boolean).sort((left, right) => {
			return right.date.localeCompare(left.date);
		});
		renderlist();
		if (articles.length === 0) {
			showerror("no articles yet.. wait, this is impossible!", "please report this, unless you're just checking the source code, in which case Don't");
			return;
		}
		route();
	}
	catch (error) {
		articlecount.textContent = "unavailable";
		showerror("unavailable?!", error.message);
	}
}

backbutton.addEventListener("click", () => {
	if (openedfromlist) {
		openedfromlist = false;
		history.back();
		return;
	}
	history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
	showindex();
});

window.addEventListener("hashchange", route);
start();
