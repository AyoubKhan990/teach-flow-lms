import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ArrowLeft, Copy, RefreshCw, FileText, File, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Alert } from '../components/Alert';
import { useToast } from '../components/useToast';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [docData, setDocData] = React.useState(location.state?.data || null);
  const [docContent, setDocContent] = React.useState(location.state?.content || '');
  const [copied, setCopied] = React.useState(false);
  const [downloading, setDownloading] = React.useState({ pdf: false, docx: false });

  const formatTopic = React.useCallback((value) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const withAi = trimmed.replace(/\bai\b/gi, 'AI');
    return withAi.charAt(0).toUpperCase() + withAi.slice(1);
  }, []);

  const normalizeFirstHeading = React.useCallback((content) => {
    if (typeof content !== 'string' || content.length === 0) return content;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim().length === 0) continue;
      if (line.startsWith('# ')) {
        lines[i] = `# ${formatTopic(line.slice(2))}`;
      }
      break;
    }
    return lines.join('\n');
  }, [formatTopic]);

  const formattedTopic = React.useMemo(() => formatTopic(docData?.topic || ''), [docData?.topic, formatTopic]);

  React.useEffect(() => {
    const incomingData = location.state?.data;
    const incomingContent = location.state?.content;
    if (incomingData && incomingContent) {
      setDocData(incomingData);
      setDocContent(incomingContent);
      try {
        sessionStorage.setItem('lastResult', JSON.stringify({ data: incomingData, content: incomingContent }));
      } catch (e) {
        void e;
      }
      return;
    }

    if (!incomingData) {
      try {
        const raw = sessionStorage.getItem('lastResult');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data && parsed?.content) {
            setDocData(parsed.data);
            setDocContent(parsed.content);
          }
        }
      } catch (e) {
        void e;
      }
    }
  }, [location.state]);

  const urlTransform = React.useCallback((url) => {
    if (typeof url !== 'string') return '';
    if (url.startsWith('data:image/')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return '';
  }, []);

  const imageSources = React.useMemo(() => {
    const uploaded = Array.isArray(docData?.images) ? docData.images : [];
    const generated = Array.isArray(docData?.generatedImages) ? docData.generatedImages : [];
    const requested = docData?.includeImages ? Number.parseInt(docData?.imageCount, 10) || 0 : 0;
    return [...uploaded, ...generated].filter(Boolean).slice(0, Math.max(0, requested));
  }, [docData]);
  
  // Create a blob for download
  const handleDownload = async (type) => {
    try {
      if (!docData || !docContent) {
        toast({ title: 'Nothing to export', message: 'Generate an assignment first.', variant: 'warning' });
        return;
      }

      setDownloading((prev) => ({ ...prev, [type]: true }));
      const payload = {
        ...docData,
        topic: formattedTopic || docData?.topic,
        images: imageSources,
        content: normalizeFirstHeading(docContent)
      };
      const response = await fetch(`http://localhost:5000/api/download/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assignment.${type === 'docx' ? 'docx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Download started', message: type === 'docx' ? 'Word document (.docx)' : 'PDF document (.pdf)', variant: 'success' });
      } else {
        let message = 'The server could not generate the file.';
        try {
          const ct = response.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const err = await response.json();
            if (typeof err?.error === 'string' && err.error.length > 0) message = err.error;
          }
        } catch (e) {
          void e;
        }
        toast({ title: 'Download failed', message, variant: 'danger' });
      }
    } catch (e) {
       void e;
       toast({ title: 'Download error', message: 'Please try again.', variant: 'danger' });
    } finally {
      setDownloading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleCopy = () => {
    if (!docContent) {
      toast({ title: 'Nothing to copy', message: 'Generate an assignment first.', variant: 'warning' });
      return;
    }
    navigator.clipboard.writeText(docContent);
      
    setCopied(true);
    toast({ title: 'Copied', message: 'Assignment text copied to clipboard.', variant: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  // Pre-process content to handle image markers for ReactMarkdown
  // We'll replace [IMAGE: description] with a standard markdown image syntax that we can hook into
  // But wait, ReactMarkdown doesn't support custom async components easily for standard rendering.
  // Instead, we can use a custom component for text nodes or handle it by splitting.
  // Actually, easiest way is to convert [IMAGE: desc] to ![desc](pollinations_url) before passing to ReactMarkdown
  
  const processedContent = React.useMemo(() => {
    if (!docContent) return "";
    let imgIndex = 0; // Use explicit index counter for stability
    return docContent.replace(/\[IMAGE:\s*(.*?)\]/g, (match, description) => {
        const provided = imageSources?.[imgIndex];
        if (typeof provided === 'string' && provided.startsWith('data:image')) {
            const descMatch = description.match(/DESCRIPTION="([^"]+)"/);
            const altText = descMatch ? descMatch[1] : "Illustration";
            imgIndex++;
            return `![${altText}](${provided})`;
        }
        if (typeof provided === 'string' && provided.startsWith('http')) {
            const descMatch = description.match(/DESCRIPTION="([^"]+)"/);
            const altText = descMatch ? descMatch[1] : "Illustration";
            imgIndex++;
            return `![${altText}](${provided})`;
        }

        const sectionTitle = description.match(/SECTION_TITLE="([^"]+)"/)?.[1] || '';
        const markerKeywords = description.match(/KEYWORDS="([^"]+)"/)?.[1] || '';
        const descMatch = description.match(/DESCRIPTION="([^"]+)"/);
        const markerDescription = descMatch ? descMatch[1] : description;

        const baseSeed = docData?.seed ? parseInt(docData.seed, 10) : 1000;
        const lockId = baseSeed + imgIndex; 
        
        const prompt = [
            'Educational diagram/illustration for an academic assignment.',
            docData?.topic ? `Topic: ${docData.topic}` : '',
            docData?.subject ? `Subject: ${docData.subject}` : '',
            sectionTitle ? `Section: ${sectionTitle}` : '',
            markerKeywords ? `Keywords: ${markerKeywords}` : '',
            markerDescription ? `Description: ${markerDescription}` : '',
            'No animals. No unrelated photos.',
            `Variation: ${lockId}`
        ].filter(Boolean).join(' | ');

        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&nologo=true&seed=${lockId}&t=${lockId}`;
        
        imgIndex++;
        
        const altText = markerDescription || sectionTitle || "Illustration";
        
        return `![${altText}](${imageUrl})`;
    });
  }, [docContent, docData, imageSources]);

  const imageStatus = docData?.imageGeneration?.status;
  const showImageStatus = Boolean(docData?.includeImages && imageStatus);
  const imageGeneratedCount = Array.isArray(docData?.generatedImages) ? docData.generatedImages.length : 0;
  const imageRequestedCount = docData?.includeImages ? Number.parseInt(docData?.imageCount, 10) || 0 : 0;

  const statusVariant =
    imageStatus === 'ok'
      ? 'success'
      : imageStatus === 'quota_exceeded'
        ? 'warning'
        : imageStatus === 'missing_key'
          ? 'warning'
          : imageStatus === 'failed'
            ? 'danger'
            : 'info';

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="sticky top-4 z-50">
          <div className="glass-panel rounded-full px-4 py-3 shadow-[var(--shadow-2)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/form')} className="rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="hidden h-6 w-px bg-black/10 sm:block" />
                <Button variant="ghost" size="sm" onClick={handleCopy} className={`rounded-full ${copied ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleDownload('docx')} className="rounded-full" disabled={downloading.docx}>
                  <FileText className="mr-2 h-4 w-4" /> Word
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleDownload('pdf')} className="rounded-full" disabled={downloading.pdf}>
                  <File className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main id="main" className="mt-8">
          {!docData && (
            <div className="mx-auto max-w-2xl">
              <Alert variant="warning" title="No result to display" role="status">
                Generate an assignment first, then come back to view and export it.
              </Alert>
              <div className="mt-4">
                <Button onClick={() => navigate('/form')} className="rounded-full">Create assignment</Button>
              </div>
            </div>
          )}

          {docData && (
            <div className="mx-auto max-w-4xl">
              {showImageStatus && (
                <div className="mb-4">
                  <Alert variant={statusVariant} title="Image generation" role="status">
                    {imageStatus === 'ok'
                      ? `Generated ${imageGeneratedCount}/${imageRequestedCount} images.`
                      : imageStatus === 'quota_exceeded'
                        ? 'Image provider quota exceeded. Try again later or upload images.'
                        : imageStatus === 'missing_key'
                          ? 'Image API key not configured for the current provider.'
                          : imageStatus === 'failed'
                            ? (docData?.imageGeneration?.errors?.[0]?.reason || 'Image generation failed.')
                            : 'Processing images.'}
                  </Alert>
                </div>
              )}

              <div className="surface relative overflow-hidden rounded-[var(--radius-card)] p-6 sm:p-10">
                <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80" />
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[color:var(--color-text)] sm:text-4xl">
                  {formattedTopic || docData?.topic || 'Assignment'}
                </h1>
                <div className="mt-6 text-[color:var(--color-text)]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    urlTransform={urlTransform}
                    components={{
                      img: ({ ...props }) => (
                        <div className="my-8 flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[color:var(--color-surface-muted)] p-4">
                          <img
                            {...props}
                            loading="lazy"
                            decoding="async"
                            className="max-h-[420px] w-full rounded-[var(--radius-card)] object-contain shadow-[var(--shadow-1)]"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {props.alt && <div className="text-sm italic text-[color:var(--color-text-muted)]">Figure: {props.alt}</div>}
                        </div>
                      ),
                      p: (props) => <p className="my-4 text-base leading-8 text-[color:var(--color-text)]" {...props} />,
                      h1: (props) => <h2 className="mt-10 text-2xl font-bold text-[color:var(--color-text)]" {...props} />,
                      h2: (props) => <h3 className="mt-10 border-b border-[color:var(--color-border)] pb-2 text-xl font-bold text-[color:var(--color-text)]" {...props} />,
                      h3: (props) => <h4 className="mt-8 text-lg font-bold text-[color:var(--color-text)]" {...props} />,
                      ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6" {...props} />,
                      ol: (props) => <ol className="my-4 list-decimal space-y-2 pl-6" {...props} />,
                      li: (props) => <li className="text-base leading-7" {...props} />,
                      blockquote: (props) => (
                        <blockquote className="my-6 rounded-[var(--radius-card)] border-l-4 border-[color:var(--color-accent)] bg-blue-50 px-4 py-3 text-[color:var(--color-text)]" {...props} />
                      )
                    }}
                  >
                    {processedContent || 'No content generated yet.'}
                  </ReactMarkdown>
                </div>
                <div className="mt-12 border-t border-[color:var(--color-border)] pt-6 text-center">
                  <div className="text-xs font-semibold uppercase tracking-widest text-black/30">Generated by AI Assignment Writer</div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Button size="lg" variant="secondary" className="rounded-full" onClick={() => navigate('/form')}>
                  <RefreshCw className="mr-2 h-5 w-5" /> Start new assignment
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Result;
