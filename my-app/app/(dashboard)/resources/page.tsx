"use client";

import { useState, useMemo } from "react";
import { Search, FileText, FileSpreadsheet, ExternalLink } from "lucide-react";

const BASE = "https://www.publichealthontario.ca";

interface Resource {
  name: string;
  path: string;
}

const INVESTIGATION_TOOLS: Resource[] = [
  { name: "Amebiasis Investigation Tool",                                            path: "/-/media/Documents/I/2017/investigation-tool-amebiasis.docx" },
  { name: "Anaplasmosis Investigation Tool",                                          path: "/-/media/Documents/I/2023/investigation-tool-anaplasmosis.docx" },
  { name: "Avian Influenza Aggregate Reporting Tool",                                 path: "/-/media/Documents/I/24/investigation-tool-avian-influenza-aggregate-reporting-tool.docx" },
  { name: "Avian Influenza Investigation Tool",                                       path: "/-/media/Documents/I/2023/investigation-tool-avian-influenza.docx" },
  { name: "Babesiosis Investigation Tool",                                            path: "/-/media/Documents/I/2023/investigation-tool-babesiosis.docx" },
  { name: "Botulism (Infant) Investigation Tool",                                     path: "/-/media/Documents/I/2017/investigation-tool-infant-botulism.docx" },
  { name: "Botulism Investigation Tool",                                              path: "/-/media/Documents/I/2017/investigation-tool-botulism.docx" },
  { name: "Brucellosis Investigation Tool",                                           path: "/-/media/Documents/I/2023/investigation-tool-brucellosis.docx" },
  { name: "Campylobacter Investigation Tool",                                         path: "/-/media/Documents/I/2017/investigation-tool-campylobacter.docx" },
  { name: "Candida auris Investigation Tool",                                         path: "/-/media/Documents/I/25/investigation-tool-c-auris.docx" },
  { name: "Carbapenemase Producing Enterobacteriaceae (CPE) Investigation Tool",      path: "/-/media/Documents/I/2018/investigation-tool-cpe.docx" },
  { name: "Cholera Investigation Tool",                                               path: "/-/media/Documents/I/2016/investigation-tool-cholera.docx" },
  { name: "Cryptosporidiosis Investigation Tool",                                     path: "/-/media/Documents/I/2017/investigation-tool-cryptosporidiosis.DOCX" },
  { name: "Cyclosporiasis Investigation Tool",                                        path: "/-/media/Documents/I/2017/investigation-tool-cyclosporiasis.docx" },
  { name: "Echinococcus multilocularis Infection Investigation Tool",                 path: "/-/media/Documents/I/2023/investigation-tool-echinococcus-multilocularis.docx" },
  { name: "Food Poisoning Investigation Tool",                                        path: "/-/media/Documents/I/2016/investigation-tool-food-poisoning.docx" },
  { name: "Giardiasis Investigation Tool",                                            path: "/-/media/Documents/I/2017/investigation-tool-giardiasis.docx" },
  { name: "Hantavirus Investigation Tool",                                            path: "/-/media/Documents/I/2023/investigation-tool-hantavirus.docx" },
  { name: "Hepatitis A Investigation Tool",                                           path: "/-/media/Documents/I/2017/investigation-tool-hep-a.docx" },
  { name: "Hepatitis C Investigation Tool",                                           path: "/-/media/Documents/I/2018/investigation-tool-hep-c.docx" },
  { name: "Legionellosis Investigation Tool",                                         path: "/-/media/Documents/I/24/investigation-tool-legionellosis.docx" },
  { name: "Listeriosis Case Management Tool",                                         path: "/-/media/Documents/I/2017/investigation-tool-listeria-case-management.docx" },
  { name: "Lyme Disease Investigation Tool",                                          path: "/-/media/Documents/I/2017/investigation-tool-lyme-case-management.docx" },
  { name: "Mpox (formerly Monkeypox) Investigation Tool",                             path: "/-/media/Documents/I/2022/investigation-tool-monkeypox-form.pdf" },
  { name: "Ontario Congenital Syphilis Investigation Tool",                           path: "/-/media/Documents/I/2023/investigation-tool-congenital-syphilis.docx" },
  { name: "Paralytic Shellfish Poisoning Investigation Tool",                         path: "/-/media/Documents/I/2016/investigation-tool-paralytic-shellfish-poisoning.docx" },
  { name: "Paratyphoid Fever Investigation Tool",                                     path: "/-/media/Documents/I/2017/investigation-tool-paratyphoid-fever.docx" },
  { name: "Plague Investigation Tool",                                                path: "/-/media/Documents/I/2023/investigation-tool-plague.docx" },
  { name: "Powassan Virus Investigation Tool",                                        path: "/-/media/Documents/I/2023/investigation-tool-powassan-virus.DOCX" },
  { name: "Psittacosis / Ornithosis Investigation Tool",                              path: "/-/media/Documents/I/2023/investigation-tool-psittacosis.docx" },
  { name: "Q Fever Investigation Tool",                                               path: "/-/media/Documents/I/2023/investigation-tool-q-fever.docx" },
  { name: "Salmonellosis Investigation Tool",                                         path: "/-/media/Documents/I/2017/investigation-tool-salmonellosis.docx" },
  { name: "Shigellosis Investigation Tool",                                           path: "/-/media/Documents/I/2017/investigation-tool-shigellosis.docx" },
  { name: "Trichinosis Investigation Tool",                                           path: "/-/media/Documents/I/2023/investigation-tool-trichinosis.docx" },
  { name: "Tularemia Investigation Tool",                                             path: "/-/media/Documents/I/2023/investigation-tool-tularemia.docx" },
  { name: "Typhoid Fever Investigation Tool",                                         path: "/-/media/Documents/I/2017/investigation-tool-typhoid-fever.docx" },
  { name: "Viral Hemorrhagic Fevers Investigation Tool",                              path: "/-/media/Documents/I/26/investigation-tool-viral-hemorrhagic-fevers.docx" },
  { name: "VTEC Investigation Tool",                                                  path: "/-/media/Documents/I/2017/investigation-tool-vtec.docx" },
  { name: "Yersiniosis Investigation Tool",                                           path: "/-/media/Documents/I/2017/investigation-tool-yersiniosis.docx" },
];

const ADDITIONAL_RESOURCES: Resource[] = [
  { name: "Investigation Tool Edits",                                                          path: "/-/media/Documents/I/2019/investigation-tool-edits.xlsx" },
  { name: "iPHIS Case Exposure Form",                                                          path: "/-/media/Documents/I/2015/investigation-tool-iphis-case-exposure-form.docx" },
  { name: "iPHIS Exposure Reference Chart",                                                    path: "/-/media/Documents/I/2019/investigation-tool-iphis-exposure-reference-chart.pdf" },
  { name: "iPHIS Quick Reference — Anaplasmosis, Babesiosis & Powassan Virus Data Entry",      path: "/-/media/Documents/I/2023/iphis-guide-anaplasmosis-babesiosis-powassan.pdf" },
  { name: "Listeriosis iPHIS Mapping Tool Questionnaire",                                      path: "/-/media/Documents/I/2017/investigation-tool-phac-listeria-iphis-mapping.docx" },
  { name: "Listeriosis PHAC Questionnaire",                                                    path: "/-/media/Documents/I/2017/investigation-tool-phac-listeria-questionnaire.doc" },
  { name: "Reportable Enteric Pathogens Companion Guide",                                      path: "/-/media/Documents/I/2017/investigation-tool-enteric-pathogens-companion-guide.docx" },
  { name: "Salmonella Appendix 2 — Source Attribution of Common Salmonella Serovars",          path: "/-/media/Documents/I/2015/investigation-tool-salmonella-source-attribution-appendix2.pdf" },
];

function fileType(path: string): string {
  return path.split(".").pop()?.toUpperCase().replace("DOCX", "DOCX") ?? "FILE";
}

function FileBadge({ ext }: { ext: string }) {
  const cls =
    ext === "PDF"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : ext === "XLSX"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

  const Icon = ext === "XLSX" ? FileSpreadsheet : FileText;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      <Icon className="h-3 w-3" />
      {ext}
    </span>
  );
}

function ResourceRow({ resource }: { resource: Resource }) {
  const ext = fileType(resource.path);
  return (
    <a
      href={BASE + resource.path}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
    >
      <span className="text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
        {resource.name}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <FileBadge ext={ext} />
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
      </div>
    </a>
  );
}

function Section({ title, resources }: { title: string; resources: Resource[] }) {
  if (resources.length === 0) return null;
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{resources.length} item{resources.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="px-2 py-1.5 divide-y">
        {resources.map((r) => (
          <ResourceRow key={r.path} resource={r} />
        ))}
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filteredTools = useMemo(
    () => (q ? INVESTIGATION_TOOLS.filter((r) => r.name.toLowerCase().includes(q)) : INVESTIGATION_TOOLS),
    [q],
  );

  const filteredAdditional = useMemo(
    () => (q ? ADDITIONAL_RESOURCES.filter((r) => r.name.toLowerCase().includes(q)) : ADDITIONAL_RESOURCES),
    [q],
  );

  const totalShown = filteredTools.length + filteredAdditional.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b">
        <h1 className="text-xl font-bold">Resources</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ontario Investigation Tools — sourced from{" "}
          <a
            href="https://www.publichealthontario.ca/en/Diseases-and-Conditions/Infectious-Diseases/CCM/OIT"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Public Health Ontario
          </a>
        </p>
      </div>

      {/* Search */}
      <div className="shrink-0 px-6 py-3 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search tools…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {q && (
          <p className="text-xs text-muted-foreground mt-2">
            {totalShown} result{totalShown !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
        {totalShown === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground rounded-xl border">
            No tools match &ldquo;{query}&rdquo;
          </div>
        ) : (
          <>
            <Section title="Investigation Tools" resources={filteredTools} />
            <Section title="Additional Resources" resources={filteredAdditional} />
          </>
        )}
      </div>
    </div>
  );
}
