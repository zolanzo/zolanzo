import {
  AUTO_LIGHT_END_HOUR,
  AUTO_LIGHT_START_HOUR,
  THEME_BROWSER_COLOR_DARK,
  THEME_BROWSER_COLOR_LIGHT,
  THEME_OVERRIDE_UNTIL_KEY,
  THEME_STORAGE_KEY,
} from "@/lib/theme/constants";

/**
 * Blocking first-paint script. Must stay aligned with schedule.ts and storage.ts.
 * Manual Light/Dark lasts only until the next 6:00 AM / 6:00 PM local boundary.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var uk=${JSON.stringify(THEME_OVERRIDE_UNTIL_KEY)};var stored=localStorage.getItem(k);var until=parseInt(localStorage.getItem(uk)||"",10);var now=Date.now();var d=new Date();var h=d.getHours();var scheduled=(h>=${AUTO_LIGHT_START_HOUR}&&h<${AUTO_LIGHT_END_HOUR})?"light":"dark";var mode=(stored==="light"||stored==="dark")?stored:null;var hasUntil=isFinite(until)&&until>0;var override=mode&&hasUntil&&now<until;if(!override&&mode&&!hasUntil&&mode!==scheduled){var b=new Date(d.getTime());if(h>=${AUTO_LIGHT_START_HOUR}&&h<${AUTO_LIGHT_END_HOUR})b.setHours(${AUTO_LIGHT_END_HOUR},0,0,0);else if(h>=${AUTO_LIGHT_END_HOUR}){b.setDate(b.getDate()+1);b.setHours(${AUTO_LIGHT_START_HOUR},0,0,0)}else b.setHours(${AUTO_LIGHT_START_HOUR},0,0,0);until=b.getTime();try{localStorage.setItem(uk,String(until))}catch(x){}override=true}var r=override?mode:scheduled;if(!override){try{localStorage.removeItem(k);localStorage.removeItem(uk)}catch(x){}}var e=document.documentElement;e.classList.toggle("dark",r==="dark");e.classList.toggle("light",r==="light");e.style.colorScheme=r;e.setAttribute("data-theme",r);e.setAttribute("data-theme-preference",r);var secure=location.protocol==="https:"?"; Secure":"";document.cookie=k+"="+r+"; Path=/; Max-Age=31536000; SameSite=Lax"+secure;var c=r==="dark"?${JSON.stringify(THEME_BROWSER_COLOR_DARK)}:${JSON.stringify(THEME_BROWSER_COLOR_LIGHT)};var metas=document.querySelectorAll('meta[name="theme-color"]');if(!metas.length){var n=document.createElement("meta");n.setAttribute("name","theme-color");n.setAttribute("content",c);document.head.appendChild(n)}else{for(var i=0;i<metas.length;i++){metas[i].removeAttribute("media");metas[i].setAttribute("content",c)}}}catch(e){}})();`;
