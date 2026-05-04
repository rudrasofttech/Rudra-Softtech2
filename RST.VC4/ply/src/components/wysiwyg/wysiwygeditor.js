import { useRef, useEffect } from "react";

export default function WysiwygEditor({ html, onChange }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        const iframeDoc = iframeRef.current.contentDocument;
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Make the iframe content editable
        //iframeDoc.body.contentEditable = "true";

        // Listen for changes
        const handler = () => {
            const doc = iframeDoc;
            const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>` : '';
            const fullHtml = doctype + doc.documentElement.outerHTML;
            onChange(fullHtml);
        };
        iframeDoc.body.addEventListener("input", handler);

        return () => {
            iframeDoc.body.removeEventListener("input", handler);
        };
    }, [html, onChange]);

    return (
        <iframe
            ref={iframeRef}
            style={{
                width: "100%",
                height: "80vh", // full viewport height
                //border: "1px solid #ccc",
            }}
            title="Preview"
        />
    );
}
