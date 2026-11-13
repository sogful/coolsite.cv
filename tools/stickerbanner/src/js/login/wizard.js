export function createwizard() {
    const steps = [...document.querySelectorAll(".flowstep")];
    const next = document.querySelector(".flowcontinue");
    const back = document.querySelector(".flowback");
    const device = document.querySelector(".flowdevice");
    const status = document.querySelector(".publishstatus");
    const sessionstatus = document.querySelector(".sessionstatus");
    const history = [];
    let stage = "device";
    let waiting = false;
    let restoring = false;
    let approval = "";
    let intent = "account";
    if (/Android/i.test(navigator.userAgent)) device.value = "android";
    else if (/iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) device.value = "apple";

    function show(destination, remember = true) {
        if (remember && stage !== destination) history.push(stage);
        stage = destination;
        waiting = false;
        status.textContent = "";
        document.querySelector(".loginrequest").value = "";
        for (const step of steps) step.hidden = step.dataset.stage !== stage;
        document.querySelector(".flowrequest").hidden = !["run","verifyrun"].includes(stage);
        document.querySelector(".flowsource").hidden = stage !== "source";
        refresh();
    }

    function refresh() {
        const phone = device.value !== "computer";
        const desktopinstruction = document.querySelector(".desktopinstruction");
        desktopinstruction.hidden = !phone;
        desktopinstruction.textContent = device.value === "apple"
            ? " turn on \"request desktop website\" in your browser's menu."
            : " turn on \"desktop site\" in your browser's menu.";
        if (stage === "approve") {
            document.querySelector(".approvalinstructions").hidden = Boolean(approval);
            if (!approval) {
                document.querySelector(".approve").hidden = !phone;
                document.querySelector(".qrpanel").hidden = phone;
            }
        }
        document.querySelector(".flowprogress").textContent = "";
        next.hidden = ["account","done","restorefailed"].includes(stage) || stage === "approve" && !approval;
        next.disabled = waiting || restoring || stage === "source" && document.querySelector(".publish").disabled;
        back.hidden = !history.length || ["approve","done","retry","restorefailed"].includes(stage);
        back.disabled = waiting || restoring;
        document.querySelector(".bannerneeded").hidden = stage !== "source" || !document.querySelector(".download").hidden;
        next.textContent = waiting ? "please wait" : "continue";
        sessionstatus.hidden = stage === "account" && !/could not|unavailable|failed/i.test(sessionstatus.textContent);
        document.querySelector(".dialogtitle").hidden = stage === "account";
        document.querySelector(".flowactions").hidden = stage === "account";
    }

    function action(selector) {
        const button = document.querySelector(selector);
        if (button.disabled) return;
        waiting = true;
        status.textContent = "";
        refresh();
        button.click();
    }

    next.addEventListener("click", () => {
        if (next.disabled) return;
        switch (stage) {
            case "device":
                if (device.value === "computer") show("save");
                else show("mobilesave");
                break;
            case "mobilesave": action(".copylauncher"); break;
            case "save": case "edit": case "retry": action(".copylogin"); break;
            case "run": case "verifyrun": action(".connect"); break;
            case "approve": if (approval === "verification") action(".copyverify"); break;
            case "source": if (document.querySelector(".origin").reportValidity()) action(".publish"); break;
        }
    });
    back.addEventListener("click", () => {if (!waiting && history.length) show(history.pop(),false);});
    device.addEventListener("change",refresh);

    new MutationObserver(refresh).observe(sessionstatus,{childList:true,subtree:true,characterData:true});
    refresh();
    return {
        refresh,
        notify(event) {
            waiting = false;
            const message = status.textContent;
            switch (event) {
                case "restoring": restoring = true; refresh(); break;
                case "accountrequest": intent = "account"; if (document.querySelector(".account").textContent.startsWith("@")) {history.length = 0; show("account",false);} break;
                case "publishrequest": intent = "publish"; if (document.querySelector(".account").textContent.startsWith("@")) {history.length = 0; show("source",false);} break;
                case "restored": restoring = false; history.length = 0; show("account",false); break;
                case "restorefailed": restoring = false; history.length = 0; show("restorefailed",false); break;
                case "nosession": restoring = false; history.length = 0; show("device",false); break;
                case "urlcopied": show("edit"); break;
                case "copied": show("run"); break;
                case "authstarted": approval = ""; show("approve"); break;
                case "connected": history.length = 0; show(intent === "publish" ? "source" : "account",false); break;
                case "verification": approval = event; history.length = 0; refresh(); break;
                case "verificationcopied": show("verifyrun"); break;
                case "loginfailed": case "expired": history.length = 0; show("retry",false); status.textContent = message; break;
                case "disconnected": history.length = 0; show("device",false); break;
                case "published": history.length = 0; show("done",false); break;
                default: refresh();
            }
        }
    };
}
