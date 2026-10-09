(() => {
  const css = `
  /* --- iOS status bar / home indicator (mock only) --- */
  #hig-status{position:fixed;inset:0 0 auto 0;height:54px;z-index:2147483647;pointer-events:none;color:#fff;font:600 17px/22px -apple-system,"SF Pro Text",system-ui;}
  #hig-status .t{position:absolute;left:0;width:150px;top:16px;text-align:center;letter-spacing:-.4px}
  #hig-status .i{position:absolute;right:0;width:150px;top:19px;display:flex;justify-content:center;gap:6px;align-items:center}
  #hig-home{position:fixed;left:50%;bottom:8px;width:139px;height:5px;margin-left:-69.5px;border-radius:3px;background:rgba(255,255,255,.75);z-index:2147483647;pointer-events:none}
  @media (orientation: landscape){#hig-status{display:none}#hig-home{bottom:6px}}
  /* --- map attribution: compact "legal" like Apple Maps, above the home indicator --- */
  .maplibregl-ctrl-bottom-right{bottom:calc(env(safe-area-inset-bottom) + 2px)!important;right:calc(env(safe-area-inset-right) + 8px)!important}
  .maplibregl-ctrl-attrib.maplibregl-compact{background:transparent!important;box-shadow:none!important;min-height:0!important;padding:0!important;margin:0!important}
  .maplibregl-ctrl-attrib.maplibregl-compact .maplibregl-ctrl-attrib-inner{display:none!important}
  .maplibregl-ctrl-attrib.maplibregl-compact .maplibregl-ctrl-attrib-button{display:none!important}
  .maplibregl-ctrl-attrib.maplibregl-compact::after{content:"法的情報";display:block;font:500 11px/13px -apple-system,system-ui;color:rgba(235,235,245,.6);padding:2px 4px}
  /* --- Dynamic Type sizes (HIG: Body 17, Subheadline 15, Footnote 13, Caption 12/11; min 11) --- */
  .text-\\[10px\\]{font-size:11px!important;line-height:13px!important}
  .text-\\[11px\\]{font-size:12px!important;line-height:16px!important}
  .text-xs{font-size:13px!important;line-height:18px!important}
  .text-sm{font-size:15px!important;line-height:20px!important}
  .text-base{font-size:17px!important;line-height:22px!important}
  .text-lg{font-size:20px!important;line-height:25px!important}
  /* the map attribution is now one short line, so bring the control column down toward the home indicator */
  div.flex-col.gap-1.rounded-full[style*="56px"]{bottom:calc(28px + env(safe-area-inset-bottom))!important}
  .z-\\[4510\\][style*="56px"]{bottom:calc(28px + env(safe-area-inset-bottom) + var(--btn-h) * 2 + 13px)!important}
  /* top row sits right under the status bar (16px -> 6px below the safe area), like Apple Maps */
  [class*="top-[calc(16px"],[class*="top-[calc(84px"]{margin-top:-13px!important}
  div[style*="top: calc(16px + env(safe-area-inset-top))"]{margin-top:-13px!important}
  /* side margin 12px for the floating map controls */
  .left-4{left:12px!important} .right-4{right:12px!important}
  div[style*="calc(88px"]{left:84px!important;right:118px!important}
  div.flex-col.gap-1.rounded-full[style*="56px"]{right:12px!important}
  .z-\\[4510\\][style*="56px"]{right:17px!important}
  /* search field text a step smaller than Body (17) so the placeholder sits comfortably */
  input[type=search]{font-size:15px!important}
  /* bring the text next to the person icon (field padding 8px -> 0) */
  div:has(> input[type=search]){padding-left:0!important}
  .leading-relaxed{line-height:1.45!important}
  /* --- label colors (HIG dark: secondary = #EBEBF5 60%, tertiary = 30%... raised to stay legible on glass) --- */
  .text-white\\/50,.text-white\\/55,.text-white\\/60,.text-white\\/65,.text-white\\/70{color:rgba(235,235,245,.62)!important}
  .text-white\\/30,.text-white\\/35,.text-white\\/40,.text-white\\/45{color:rgba(235,235,245,.48)!important}
  .placeholder-white\\/45::placeholder,.placeholder-white\\/40::placeholder,.placeholder-white\\/35::placeholder{color:rgba(235,235,245,.42)!important}
  /* --- map callouts: title larger, tinted action like Apple Maps, no stray focus ring --- */
  .debug-popup .maplibregl-popup-content{padding:14px 16px!important;border-radius:18px!important}
  .search-popup-title{font-size:17px!important;line-height:22px!important;padding-right:20px}
  .search-popup-favorite{border:0!important;background:rgba(167,139,250,.18)!important;color:#ddd6fe!important;font-size:15px!important;border-radius:12px!important}
  .search-popup-favorite[data-favorite="true"]{background:#6d28d9!important;color:#fff!important}
  .search-popup-favorite:focus-visible,.night-popup-fav:focus-visible>span{outline:none!important}
  .maplibregl-popup-close-button{font-size:22px!important;width:32px;height:32px;top:6px!important;right:6px!important;color:rgba(235,235,245,.6)!important}
  .night-popup-caption{font-size:15px!important;line-height:20px!important}
  .night-popup-meta-row{font-size:12px!important}
  .night-popup-hint{font-size:11px!important}
  .night-popup-bubble{font-size:13px!important;padding:7px 12px!important}
  `;
  // ステータスバーの記号は純正の SF Symbols（cellularbars / wifi / battery.100、Semibold）を macOS で書き出した PNG。作り方は scripts/mockup/sf-symbols.swift
  const svg = `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAwCAYAAACynDzrAAAAAXNSR0IArs4c6QAAAGxlWElmTU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAADYAAAAAQAAANgAAAABAAKgAgAEAAAAAQAAAEigAwAEAAAAAQAAADAAAAAAjZ7tjwAAAAlwSFlzAAAhOAAAITgBRZYxYAAAAqZJREFUaAXtmT1rFEEYx3PxJQoWBkQIRAgBiS8fIF8ggq1f4JIi6ays0moKEbuApYUKCmJhCgnYGFIkVUgbUiUIVlFJICh5O38TcpvLZmaeGe7mbm99Hvizu8/LzD6/m9vd2+vpUVMCSkAJdI5ApXNTp5+5VqtdZ5YqGkYXcjPucbyCPlYqlYNcrPyHwLmJNpBk8ySUeqFYP22anpHINMTHrIPg7HUFSuC/G9GDM7fMgC5GAMpfn7LSMgPKmmxmRwEJ9BSQAhIICOGYC5kwVOvD3IZvMeo4Mtv8av+LbxF94kGvxjaJFRYQcMytdwmZp2GXPSbwBk24Epr15z+VZsdrZf00g/ng1OcaP4FZP27ptsiA7kR0OhKRG5VaZEDOhzdLhzG5lnK3q8iA3GfdxogCEmArIAFQ0ts8d5erzP8ADaD8O5ddfAs8w3xnW1hLBgg4Q3T9DZmty/bJmwTSW1dCp/0pv2LPaW5IaPAS8VdAuibkdSycEtBoYFcGzr3A3LanpQRkVkeoXQ5NbHdeSkDt7iXJfApIwOq9i3HxvE39I3TDMs4Ovi/cgVYtsdK4nICA85AuP6M+T7fPyJsC0mtPTleHfF+xFwIc07h5+HsJJCdok9TN5gN0P7CxfvLMk3IpzQco5hVCTG5XgfQB6qpGUp2sAhLIKiAFJBAQwrqCFJBAQAjrCvqPAbXk72jfCvopwK2HzYn8rh80bEPrTYkt1+ZrGP7Mri3315kM/4Gt/rjCB+iDf8wsan7Rb2dHpzuh9eZtwNppWbb3Ptvz72wSXrakhM5vzn3eUu938QP0CppFW8hm2zjfIfNb7Jzh70VP0Q9ks12cc2jwXPGJg9gTtImOUN7+4PiKRjz1VeLr6BDlbQ/HMgp9NeyaRv1KQAkogWQE/gHKSEwbU1/uzwAAAABJRU5ErkJggg==" style="height:12px"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAAtCAYAAADydghMAAAAAXNSR0IArs4c6QAAAGxlWElmTU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAADYAAAAAQAAANgAAAABAAKgAgAEAAAAAQAAADygAwAEAAAAAQAAAC0AAAAAAlJXAAAAAAlwSFlzAAAhOAAAITgBRZYxYAAAA+RJREFUaAXtmUtIFWEYhj3dJC1LpGihdLOiIrsIuSgCuxAFUqBQQRBJEOWqoE0tWhRUm9pIi6JwEYLhUlqIoBVBlC2ysqK0GxZphXnNsk7PC0ccxjPOP3MujnBeeJgZ5/u/yz9z/suYlpZSqgdSPZDqgVQPBLcHQolOLRwOZxJjBSyCHMiCdAjDEPRAF7yDN6FQaJBjwhTXgiluBpkWQTFshpWQC6ZSJ3yEVrgPjdBMJwxzDIYoMgP2Qx0MQLzVg8Na2Avq0IkRwQugCnohWfpBoKuwLGlVE2wT6GlOpP4SvAbWJaxwnOeBXq0g6R/J3IR5cSscZ1PgFPRBUKVX/ahJ0eOO0jhRz1XDdhNnNhuNrE/hCbRF6OTYB/2g2JqyZsECWBqhkGMBTAGvqqVBOaN6r9eGaRRbBJ/Ai75irEFlB6gYX6JtFuyCa/ANvOg1xqs8BabBTuj3EKUB290w1VMgA2N8ToM9cA9M9R1DrQfchWExDBp6rsduvbvX+FgQayM0GebWjZ37KI5Ri4HDdmxK4lOGdy/ELgOTn1uD3fuYQQtHBzGqAqfX8xb3jnsZGPCZQZt8WAJaS2ug0jJSA1g3tEMbPn9xNBI+szG8DqUODbROL8NnncP90T/jrBSGwKrfXBwetXI+wy4T9oEGHQ0imi/dpMXEM6gELSO1wXAVdhUwDFb95KLYtbHVgAYaaUfmXjnYZr0f7Rwb/caqwcuAh3lU6Td4A9ZEi2X9GzYlMBJTM8UG633jczWEK6Bdj6O4XwiNkCjV4dgtB+V6ARY7JhrrDZxrp6R5V69joqWf1EWYHmvevtoTeDk8h2TrIQHzfCXttxEB10Jnsiu1xPvAuZainjVmWnLzQCBNV1/AdIcygG09NEELaArSZx2tleeAEtfiZWsE01f2JVOOtyUkAXyJom9betvp9BU3joDmXCNhmwMnwWRRUWnkNB5GJKQtowaraNJ0cgz0JvgSbdPhNAxANJ335TjWRmRyxpbNI64Xxup3pD2+VkOrJYYWGEb73hEfcT+SwCHQU9VrriVkXIXPbKiHLoh5/e550PJbDclqqbgFtMHXhl9r6Q5ohgcMQH84Tn5R6Gy4BHoLnKSndxZmTuqKKUAfEjrAVO8x1Fsw+UTi2nHZdzEmhWuX5ucbmlEn+flQZuQYowrwMzXpvwvlpkECY8dTyoe3Jo/UZvOC69zAFOIlERKfD49tBY13eZebc73ECJwtBWTCnfGqjNyr4Wj0lSNwRdoTohB9atW/RJx0mRtJWxPY80vYNUWds1Wsb10nEhYwCI4p8AB8Bs25MS8Vg1BTKodUD6R6IHk98B9ILA3X6pxBLwAAAABJRU5ErkJggg==" style="height:12px"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAAAqCAYAAAAzikzDAAAAAXNSR0IArs4c6QAAAGxlWElmTU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAADYAAAAAQAAANgAAAABAAKgAgAEAAAAAQAAAFqgAwAEAAAAAQAAACoAAAAAZKNrFgAAAAlwSFlzAAAhOAAAITgBRZYxYAAABDRJREFUaAXtmkloFEEUhmfUqLhHwTUSyMEVERUXRCVHLyIGEb14cQuICnoQI2q8C0LUg+DFk2AQNRf1YFyQqAcXcLmJcTm5xC1x1/F7MjXU9FRX90x6ku6kHvxU1atX9d77p6amq3pSKSeOAceAY8Ax4Bjo5wykS8k/k8lMZNwiMAtMBZVgBBgEBoC4yl8C+wU6wXvwCjwBd9PptLTLJqGJhlwhcSPYBhaC0GOxjbvIB3ALnADNkJ6JOuBQZEHyHByfAbOjDiCG890hpg2Q3R5lbIFEQ/IyHF4Gw6N0HPO53hFfLWTLthKJWImG5Cl4eQRkD+5v8oKE50L2pygSl33XJkfo9CNZ9rU28BC0gy7wHcRZZGENASNBDZDfmgXAJNUoD4I9ps7IdKzmKvAHmOQsysmROevFichjGmg1JYmuE5R3y8TBDh/nF3qRl7K4Js8KcNsn3zVROLVtHUt9HOxVegKTr+IqsBiMAnF+hia8/yJb3gdwg/33qmgof5FLA9VWaXtEeDjv0UXXxPF9wyec9ytMf5PBJkmqfYoxgk6DDkPwLcqmO6VtBZr24MfKGQENpV6v2gktd6m4WdVySHmq2lo5SaunyHsJOAnkbBFabESPNswiz5dK5BheoRoJLSdAmJ6Dnp9KaYyqZMtxlFuBfOO3e/p8mzaiBxtGfdV0tv1dM4t9Vc/jmyFaEw9iJuOOQ/Y6w5gClY1oU1/kdwAFEfWuQn4ovWLiQbc5BtnDdIWpHjSJaYzT5TMwnmZdvqqw5Ygu5KQUzfKgQY7oIIbC9U8IMnNEBzEUrv9zkJkjOoihcP0Pgswc0UEMBff/xKQ5yMxGdF9/lDNxY7qfD+LhKKfK16bJdJ2N6N+6YbYud7lKTM+cqi9JpZ6Hnp/KQV7m+slFOg74dep6G9FfdMNsXW7olHSoSoLLLlbjDy1+PT+lNvHwks7doE5u/pShrdSPn167NyjGepTTVRsHHzkR3aS9QukSWHrv1nP5abm81epSvUTu1R5dYNNG9DNGz/DMMA9yK3H0IatfS3kYyJ2tXELZviF0x0Jkq5Bv4zXQCP4LeU2jMjXb1AvhISfkrm81OX3JFRw3ApMcKnnSGA8k0VOmZNFtKmvYOFjo4/g3+s1ldd6Dk5PLQNDgk6u8MzXdyxcdoelxJjcJTu7RmJ9T5Ffk7bc8P94Hz4H8zSopb8HlR68GyFvw9cC0N6NOtbBVrJZKdyWI6FoctAKrXXeDiOl4WTQLINr01qXokK0/Xji5zoz7i541+QMypFAfFclCR6iVyhayE1v5M43+2kfG90WRPwJtgeQzUSZnXdHKEU6bqM8F58Afpe9jpRxcToNZUZMsPIVa0WKohNUtd68rwRIwE1QBOdgMB7Lii56TMT0l8gwsVwty2pNnafX/6DbqVyBYnQ9oOnEMOAYcA46B/sLAP6WxnmyU6GWGAAAAAElFTkSuQmCC" style="height:13px">`;
  const add = () => {
    if (document.getElementById('hig-style')) return;
    const s = document.createElement('style'); s.id = 'hig-style'; s.textContent = css; document.head.append(s);
    const b = document.createElement('div'); b.id = 'hig-status'; b.innerHTML = `<span class="t">9:41</span><span class="i">${svg}</span>`; document.body.append(b);
    const h = document.createElement('div'); h.id = 'hig-home'; document.body.append(h);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
})();
