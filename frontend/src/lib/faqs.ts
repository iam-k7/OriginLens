/** Home page FAQ: shown by the Faq component and published as FAQPage structured data. */
export const FAQS = [
  {
    q: "Do you store my images or text?",
    a: "No. Image checks run in your browser, so your images are not uploaded. Text you send to Rewrite or Deep Scan goes to our AI provider to produce the result and is not stored by us. We only count how many checks each visitor uses, for the daily free limit.",
  },
  {
    q: "Can OriginLens tell if an image is AI-generated?",
    a: "It shows the evidence the file carries: Content Credentials (C2PA), IPTC digital-source tags and generator fingerprints. You can also run an experimental pixel check (an open model that runs on your device) that gives an AI likelihood. It can miss AI images, so a low score does not prove an image is real — and missing metadata proves nothing either way.",
  },
  {
    q: "What does Privacy Clean remove?",
    a: "GPS location, EXIF, XMP, IPTC, Content Credentials and comments from JPEG, PNG and WEBP files. The pixels are copied byte-for-byte and the color profile is kept, so quality doesn't change.",
  },
  {
    q: "Does removing metadata change where an image came from?",
    a: "No. It removes information embedded in the file; it doesn't change the image's true origin. An AI-generated image stays AI-generated.",
  },
  {
    q: "Which files can I upload?",
    a: "JPEG, PNG, WEBP and GIF up to 15 MB. We check the real file signature, not the extension. SVG is rejected because it can carry scripts.",
  },
  {
    q: "Is the text tool an AI detector?",
    a: "No. It measures explainable style signals sentence by sentence, in your browser. Rewrite Naturally and Deep Scan send your text to our AI provider to produce their result.",
  },
];
