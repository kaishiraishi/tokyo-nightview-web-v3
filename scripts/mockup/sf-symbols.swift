import AppKit
// 純正の SF Symbols を、白で、指定のポイントサイズ・太さで PNG に書き出す（3 倍）
let items: [(String, CGFloat)] = [("wifi", 15), ("cellularbars", 15), ("battery.100", 17)]
for (name, size) in items {
    let cfg = NSImage.SymbolConfiguration(pointSize: size, weight: .semibold).applying(.init(paletteColors: [.white]))
    guard let img = NSImage(systemSymbolName: name, accessibilityDescription: nil)?.withSymbolConfiguration(cfg) else { print("missing", name); continue }
    let scale: CGFloat = 3
    let w = Int(ceil(img.size.width * scale)), h = Int(ceil(img.size.height * scale))
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = img.size
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    img.draw(in: NSRect(origin: .zero, size: img.size))
    NSGraphicsContext.restoreGraphicsState()
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "sym-\(name).png"))
    print(name, img.size.width, img.size.height)
}
