"use strict";

(function () {
	if (document.querySelector(".bg")) return;

	const background = document.createElement("div");
	background.className = "bg";
	background.setAttribute("aria-hidden", "true");
	background.innerHTML = `
		<div class="bggradient"></div>
		<div class="bgclouds"></div>
		<div class="bglevels">
			<img src="/assets/images/bg/levelp1.webp" alt="">
			<img src="/assets/images/bg/levelp2.webp" alt="">
			<img src="/assets/images/bg/levelp3.webp" alt="">
			<img src="/assets/images/bg/levelp4.webp" alt="">
		</div>
		<div class="bgfade"></div>
	`;
	document.body.prepend(background);
})();
