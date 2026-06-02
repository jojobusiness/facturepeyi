// Embarque le XML Factur-X dans un PDF existant + injecte les métadonnées XMP
// nécessaires pour qu'un lecteur/PDP reconnaisse le document comme Factur-X.
//
// Pipeline : react-pdf produit le PDF visuel → ce module y attache `factur-x.xml`
// (AFRelationship = Data) et déclare l'extension XMP Factur-X (DocumentType,
// ConformanceLevel BASIC, Version 1.0) + le marqueur PDF/A-3B.
//
// ⚠️ Limite assumée : la conformité PDF/A-3B au niveau octet (OutputIntent/ICC,
//    sous-ensembles de polices) dépend du moteur react-pdf et doit être validée
//    avec un validateur (Mustang/FNFE) avant de communiquer « certifié ». Le XML
//    structuré, lui, est conforme EN 16931 BASIC. Voir mémoire project-reforme-einvoicing.

import { PDFDocument, AFRelationship, PDFName } from "pdf-lib";
import { buildFacturXXML } from "./facturX";

const FX_NS = "urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#";

function xmpMetadata({ title, profile }) {
  const safeTitle = String(title || "Facture").replace(/[<>&]/g, " ");
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${safeTitle}</rdf:li></rdf:Alt></dc:title>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:fx="${FX_NS}">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>${profile}</fx:ConformanceLevel>
    </rdf:Description>
    <rdf:Description rdf:about=""
        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>${FX_NS}</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>name of the embedded XML invoice file</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>INVOICE</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The actual version of the Factur-X XML schema</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The conformance level of the embedded Factur-X data</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Embarque le XML Factur-X dans un PDF.
 * @param {ArrayBuffer|Uint8Array} pdfBytes  PDF source (sortie react-pdf)
 * @param {string} xml                       XML CII Factur-X
 * @param {{ title?: string, profile?: string }} opts
 * @returns {Promise<Uint8Array>} PDF avec XML embarqué + XMP
 */
export async function embedFacturX(pdfBytes, xml, opts = {}) {
  const profile = opts.profile || "BASIC";
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // 1. Attacher le XML structuré (AFRelationship = Data, requis par Factur-X)
  await pdfDoc.attach(new TextEncoder().encode(xml), "factur-x.xml", {
    mimeType: "application/xml",
    description: "Factur-X",
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Data,
  });

  // 2. Métadonnées document
  pdfDoc.setTitle(opts.title || "Facture");
  pdfDoc.setProducer("Factur'Peyi");
  pdfDoc.setCreator("Factur'Peyi");

  // 3. Injecter le flux de métadonnées XMP (déclare Factur-X + PDF/A-3B)
  const xmp = xmpMetadata({ title: opts.title, profile });
  const metadataStream = pdfDoc.context.stream(xmp, {
    Type: "Metadata",
    Subtype: "XML",
  });
  const metadataRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of("Metadata"), metadataRef);

  return await pdfDoc.save();
}

/**
 * Génère le PDF Factur-X complet à partir d'un blob PDF visuel + du contexte facture.
 * @param {Blob} pdfBlob   blob produit par react-pdf
 * @param {object} invoice contexte facture enrichi
 * @returns {Promise<Blob>} PDF Factur-X (application/pdf)
 */
export async function makeFacturXBlob(pdfBlob, invoice) {
  const bytes = new Uint8Array(await pdfBlob.arrayBuffer());
  const xml = buildFacturXXML(invoice);
  const out = await embedFacturX(bytes, xml, {
    title: invoice.numero || "Facture",
    profile: "BASIC",
  });
  return new Blob([out], { type: "application/pdf" });
}
