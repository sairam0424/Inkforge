---
slug: how-i-traced-one-browser-request-from-keystroke-to-rendered-page
type: linkedin-post
for_medium: https://medium.com/@uggesairam0000/what-happens-when-you-type-www-google-com-a90611c7b9c0
for_substack: https://sairam0000.substack.com/p/how-i-traced-one-browser-request
created_date: 2026-06-19
status: ready
carousel_slides: carousel-slide-01.png through carousel-slide-10.png
format_note: "Carousel/PDF = 7.00% engagement (best on LinkedIn). Upload as PDF document post."
---

# LinkedIn Post

## FORMAT A — Carousel PDF (RECOMMENDED — 7.00% avg engagement)
Upload carousel-slide-01.png through carousel-slide-10.png as a PDF document post.
Use the caption below. Carousel/PDF is the highest-performing format on LinkedIn (2025 data).

### Carousel Caption (short — let the slides do the work):

---

Every engineer should know this.

I typed www.google.com one evening and the page loaded in under 200ms.

I sat there genuinely wondering — what actually just happened?

Swipe to trace every layer 👉

🔗 Full deep-dive on Medium → https://medium.com/@uggesairam0000/what-happens-when-you-type-www-google-com-a90611c7b9c0
🔗 Also on Substack → https://sairam0000.substack.com/p/how-i-traced-one-browser-request

Which layer surprised you most? 👇

#SystemDesign #Networking #SoftwareEngineering #Programming #ComputerScience

---

## FORMAT B — Text Post (use if you can't upload PDF)

---

I typed www.google.com one evening and the page loaded in under 200ms.

I sat there wondering — what actually just happened?

Turns out that 200ms isn't one thing.

It's 4 layers. Each one solving a problem the previous layer created.

Here's what's happening behind the scenes every single time you visit a website 👇

─────────────────────

🔍 Layer 1: DNS — "Who even is google.com?"

Your browser has no idea where Google lives.
It has to find the address first.

Browser cache → OS cache → Recursive resolver → Root servers → TLD servers → Google's nameserver

All of that, just to get a number like 142.250.183.100

─────────────────────

🤝 Layer 2: TCP — A handshake before anything moves

SYN → SYN-ACK → ACK

Three packets. One round trip.
Nothing moves until both sides prove they can talk to each other.

If you're in Mumbai connecting to a London server?
That handshake alone costs ~150ms. Before a single byte of real data moves.

─────────────────────

🔒 Layer 3: TLS — Lock the channel

Your browser and Google agree on encryption keys.
Verify the certificate. Lock everything down.

TLS 1.3 does this in 1 round trip.
TLS 1.2 needed 2. That's a full 100ms saved — on every single cold load.

And here's the wild part:
After all this encryption, your ISP can STILL see which domain you visited.
HTTPS hides content. Not destination.

─────────────────────

📤 Layer 4: HTTP/2 GET / — Finally. The actual request.

After DNS + TCP + TLS, the browser sends one GET request.

HTTP/2 multiplexes everything — HTML, CSS, JS, images — over one connection simultaneously.
No waiting. No queuing. All at once.

─────────────────────

5 things most engineers don't know about this:

→ Chrome starts DNS lookup before you finish pressing Enter
→ There are NOT 13 root servers — there are 1,600+ physical instances worldwide
→ google.com's TTL is only 5 minutes — short enough to reroute global traffic instantly
→ TLS 1.3 saved one full round trip over TLS 1.2 — that's 100ms back every cold load
→ HTTPS hides content, not destination — your ISP sees every domain you visit via SNI

─────────────────────

The whole thing takes under 200ms.
And every millisecond has a name and an owner.

I wrote a full deep-dive with diagrams for every layer — DNS resolution chain, TCP sequence, TLS 1.3 vs 1.2 comparison, and a complete latency budget breakdown.

🔗 Read on Medium → https://medium.com/@uggesairam0000/what-happens-when-you-type-www-google-com-a90611c7b9c0

🔗 Read on Substack → https://sairam0000.substack.com/p/how-i-traced-one-browser-request

─────────────────────

Which layer surprised you the most? Drop it in the comments 👇

♻️ Repost if this made the internet make sense for someone in your network.

#SystemDesign #Networking #DNS #WebDevelopment #SoftwareEngineering #TechLearning #BackendDevelopment #HTTP #Programming #ComputerScience

---

## Post Notes
- Attach cover-medium.png as the post image
- Best time: Tuesday–Thursday 8–10am or 12–1pm your timezone
- After posting, comment first: "Which layer surprised you? For me it was SNI — HTTPS hides content but your ISP still sees every domain you visit 👀"
