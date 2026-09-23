import crypto from "crypto"

/*
A self-hosted CAPTCHA. No third-party service and no API keys to leak.

The answer never leaves the server: we hand the client a random id plus a
distorted SVG image, and keep the expected text here until it is submitted.
Each challenge is single use and expires, so a solved image cannot be replayed.
*/

const CAPTCHA_TTL_MS = 5 * 60 * 1000   // a challenge is valid for 5 minutes
const MAX_PENDING = 5000               // hard ceiling so the store cannot grow without bound

// Ambiguous glyphs (0/O, 1/I/l) are excluded so a correct answer is never rejected.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

const pending = new Map()

const purgeExpired = () => {
    const now = Date.now()
    for(const [id, entry] of pending)
    {
        if(entry.expiresAt <= now) pending.delete(id)
    }
}

const randomInt = (min, max) => min + crypto.randomInt(max - min + 1)

const randomText = (length = 5) => {
    let text = ""
    for(let i = 0; i < length; i++)
    {
        text += ALPHABET[crypto.randomInt(ALPHABET.length)]
    }
    return text
}

// A minimal stroke font. Each glyph is a list of polylines on a 6 x 10 grid.
// Drawing the characters as paths keeps the answer out of the SVG markup — a
// scraper reading the raw file sees only coordinates, never the text itself.
const GLYPHS = {
    A: [[[0,10],[3,0],[6,10]], [[1,7],[5,7]]],
    B: [[[0,0],[0,10]], [[0,0],[4,0],[5,1],[5,4],[4,5],[0,5]], [[0,5],[4,5],[5,6],[5,9],[4,10],[0,10]]],
    C: [[[6,2],[4,0],[2,0],[0,2],[0,8],[2,10],[4,10],[6,8]]],
    D: [[[0,0],[0,10]], [[0,0],[3,0],[5,2],[5,8],[3,10],[0,10]]],
    E: [[[6,0],[0,0],[0,10],[6,10]], [[0,5],[4,5]]],
    F: [[[6,0],[0,0],[0,10]], [[0,5],[4,5]]],
    G: [[[6,2],[4,0],[2,0],[0,2],[0,8],[2,10],[4,10],[6,8],[6,5],[3,5]]],
    H: [[[0,0],[0,10]], [[6,0],[6,10]], [[0,5],[6,5]]],
    J: [[[6,0],[6,8],[4,10],[2,10],[0,8]]],
    K: [[[0,0],[0,10]], [[6,0],[0,5]], [[0,5],[6,10]]],
    L: [[[0,0],[0,10],[6,10]]],
    M: [[[0,10],[0,0],[3,5],[6,0],[6,10]]],
    N: [[[0,10],[0,0],[6,10],[6,0]]],
    P: [[[0,10],[0,0],[4,0],[6,2],[6,4],[4,6],[0,6]]],
    Q: [[[6,2],[4,0],[2,0],[0,2],[0,8],[2,10],[4,10],[6,8],[6,2]], [[4,7],[6,10]]],
    R: [[[0,10],[0,0],[4,0],[6,2],[6,4],[4,6],[0,6]], [[3,6],[6,10]]],
    S: [[[6,2],[4,0],[2,0],[0,2],[0,4],[2,5],[4,5],[6,6],[6,8],[4,10],[2,10],[0,8]]],
    T: [[[0,0],[6,0]], [[3,0],[3,10]]],
    U: [[[0,0],[0,8],[2,10],[4,10],[6,8],[6,0]]],
    V: [[[0,0],[3,10],[6,0]]],
    W: [[[0,0],[1,10],[3,4],[5,10],[6,0]]],
    X: [[[0,0],[6,10]], [[6,0],[0,10]]],
    Y: [[[0,0],[3,5],[6,0]], [[3,5],[3,10]]],
    Z: [[[0,0],[6,0],[0,10],[6,10]]],
    2: [[[0,2],[2,0],[4,0],[6,2],[6,4],[0,10],[6,10]]],
    3: [[[0,1],[2,0],[4,0],[6,2],[4,5],[6,7],[4,10],[2,10],[0,9]]],
    4: [[[4,10],[4,0],[0,6],[6,6]]],
    5: [[[6,0],[0,0],[0,4],[4,4],[6,6],[6,8],[4,10],[2,10],[0,9]]],
    6: [[[6,1],[4,0],[2,0],[0,3],[0,8],[2,10],[4,10],[6,8],[6,6],[4,5],[2,5],[0,7]]],
    7: [[[0,0],[6,0],[2,10]]],
    8: [[[2,5],[0,3],[0,1],[2,0],[4,0],[6,1],[6,3],[4,5],[2,5]], [[4,5],[6,7],[6,9],[4,10],[2,10],[0,9],[0,7],[2,5]]],
    9: [[[0,9],[2,10],[4,10],[6,7],[6,2],[4,0],[2,0],[0,2],[0,4],[2,5],[4,5],[6,3]]]
}

const randomFloat = (min, max) => min + (crypto.randomInt(10000) / 10000) * (max - min)

// Walks a polyline and returns `count` points spread along it, so the number of
// vertices in the rendered path carries no information about which glyph it is.
const resample = (polyline, count) => {

    const segments = []
    let total = 0

    for(let i = 1; i < polyline.length; i++)
    {
        const [x1, y1] = polyline[i - 1]
        const [x2, y2] = polyline[i]
        const length = Math.hypot(x2 - x1, y2 - y1)
        segments.push({ x1, y1, x2, y2, length })
        total += length
    }

    if(total === 0) return [polyline[0]]

    const points = []

    for(let i = 0; i < count; i++)
    {
        let target = (i / (count - 1)) * total
        let walked = 0

        for(const segment of segments)
        {
            if(walked + segment.length >= target || segment === segments[segments.length - 1])
            {
                const t = segment.length === 0 ? 0 : (target - walked) / segment.length
                points.push([
                    segment.x1 + (segment.x2 - segment.x1) * Math.min(Math.max(t, 0), 1),
                    segment.y1 + (segment.y2 - segment.y1) * Math.min(Math.max(t, 0), 1)
                ])
                break
            }
            walked += segment.length
        }
    }

    return points
}

const buildSvg = (text) => {

    const width = 200
    const height = 70
    const step = width / (text.length + 0.6)

    const glyphs = [...text].map((char, index) => {

        const strokes = GLYPHS[char]
        if(!strokes) return ""

        const scale = randomInt(34, 42) / 10
        const originX = step * (index + 0.35) - 3 * scale
        const originY = randomInt(12, 20)
        const rotation = randomInt(-26, 26)
        const shade = randomInt(185, 240)
        const centreX = originX + 3 * scale
        const centreY = originY + 5 * scale

        // A random shear per glyph, so the outline is never an exact rotation
        // of the reference shape.
        const shear = randomFloat(-0.22, 0.22)
        const squash = randomFloat(0.88, 1.12)

        const place = ([x, y]) => {
            const sx = originX + (x + y * shear) * scale + randomFloat(-1.6, 1.6)
            const sy = originY + y * squash * scale + randomFloat(-1.6, 1.6)
            return `${sx.toFixed(1)},${sy.toFixed(1)}`
        }

        const drawn = strokes.map((polyline) => {
            // Vary the vertex count so path structure leaks nothing.
            const points = resample(polyline, randomInt(polyline.length + 2, polyline.length + 7))
            const d = points.map((pt, i) => `${i === 0 ? "M" : "L"}${place(pt)}`).join(" ")
            return `<path d="${d}" stroke="rgb(${shade},${shade},${shade})" stroke-width="${randomInt(25, 34) / 10}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
        })

        // One decoy stroke per glyph, so the set of paths in a group does not
        // map cleanly onto the character. Kept short, thin and dim: enough to
        // break automated shape matching, faint enough that the eye still
        // reads the glyph underneath it.
        {
            const startX = randomFloat(-1, 7)
            const startY = randomFloat(-1, 11)
            const points = Array.from({ length: randomInt(2, 3) }, (unused, j) => [
                startX + randomFloat(-2.2, 2.2) * (j + 1),
                startY + randomFloat(-2.2, 2.2) * (j + 1)
            ])
            const d = [[startX, startY], ...points]
                .map((pt, j) => `${j === 0 ? "M" : "L"}${place(pt)}`)
                .join(" ")
            const decoyShade = randomInt(95, 130)
            drawn.push(`<path d="${d}" stroke="rgb(${decoyShade},${decoyShade},${decoyShade})" stroke-width="${randomInt(12, 18) / 10}" stroke-linecap="round" fill="none" opacity="0.4"/>`)
        }

        // Shuffle so the real strokes are not always first in the markup.
        for(let i = drawn.length - 1; i > 0; i--)
        {
            const j = crypto.randomInt(i + 1);
            [drawn[i], drawn[j]] = [drawn[j], drawn[i]]
        }

        return `<g transform="rotate(${rotation} ${centreX.toFixed(1)} ${centreY.toFixed(1)})">${drawn.join("")}</g>`
    }).join("")

    // Crossing lines and speckles frustrate automated solvers without hurting legibility.
    const lines = Array.from({ length: 5 }, () => {
        const shade = randomInt(90, 150)
        return `<path d="M${randomInt(0, 40)},${randomInt(5, 65)} Q${randomInt(60, 140)},${randomInt(0, 70)} ${randomInt(160, 200)},${randomInt(5, 65)}" stroke="rgb(${shade},${shade},${shade})" stroke-width="${randomInt(1, 2)}" fill="none" opacity="0.7"/>`
    }).join("")

    const dots = Array.from({ length: 45 }, () => {
        const shade = randomInt(80, 160)
        return `<circle cx="${randomInt(0, width)}" cy="${randomInt(0, height)}" r="${randomInt(1, 2)}" fill="rgb(${shade},${shade},${shade})" opacity="0.6"/>`
    }).join("")

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#121212"/>${dots}${lines}${glyphs}</svg>`
}

const createCaptcha = () => {

    purgeExpired()

    // Under a flood, drop the oldest entries rather than refusing new visitors.
    while(pending.size >= MAX_PENDING)
    {
        const oldestKey = pending.keys().next().value
        pending.delete(oldestKey)
    }

    const text = randomText()
    const captchaId = crypto.randomUUID()

    pending.set(captchaId, {
        answer: text.toLowerCase(),
        expiresAt: Date.now() + CAPTCHA_TTL_MS
    })

    const svg = buildSvg(text)

    return {
        captchaId,
        expiresIn: Math.floor(CAPTCHA_TTL_MS / 1000),
        // base64 data URI: renders in an <img>, where SVG cannot execute script.
        image: `data:image/svg+xml;base64,${Buffer.from(svg, "utf-8").toString("base64")}`
    }
}

// Returns null when the challenge is valid, otherwise the reason it failed.
const consumeCaptcha = (captchaId, answer) => {

    if(!captchaId || !answer?.trim())
    {
        return "Please complete the captcha!"
    }

    const entry = pending.get(captchaId)

    if(!entry)
    {
        return "Captcha expired, please try a new one!"
    }

    // Single use: solving it once must not let the same image be replayed.
    pending.delete(captchaId)

    if(entry.expiresAt <= Date.now())
    {
        return "Captcha expired, please try a new one!"
    }

    if(entry.answer !== answer.trim().toLowerCase())
    {
        return "Incorrect captcha, please try again!"
    }

    return null
}

export { createCaptcha, consumeCaptcha }
