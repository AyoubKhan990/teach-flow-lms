document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('download-pdf');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadPDF);
    }
});

function downloadPDF() {
    const previewPaper = document.getElementById('cv-preview');
    const cvContainer = document.querySelector('.cv-container');
    const btn = document.getElementById('download-pdf');

    if (!previewPaper || !cvContainer) return;

    // Visual feedback
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    // 1. Store original styles to restore later
    const originalTransform = previewPaper.style.transform;
    const originalTransformOrigin = previewPaper.style.transformOrigin;
    const originalWidth = cvContainer.style.width;
    const originalMargin = cvContainer.style.margin;

    // 2. Prepare for peak-quality capture
    // Reset zoom transformation so html2pdf captures at 1:1 scale
    previewPaper.style.transform = 'none';
    previewPaper.style.transformOrigin = 'unset';

    // Add printing class to remove shadows and margins
    cvContainer.classList.add('printing-mode');

    // Force dimensions slightly less than A4 to prevent any overflow
    // A4 width is 210mm. We use 209mm to be safe and avoid right-side clipping.
    cvContainer.style.width = '209mm';
    cvContainer.style.margin = '0 auto';
    cvContainer.style.boxShadow = 'none';

    // STRICT SINGLE PAGE ENFORCEMENT
    // We force the container to be exactly one A4 page high.
    // Content that overflows will be hidden or scaled down.
    cvContainer.style.maxHeight = '296.5mm';
    cvContainer.style.overflow = 'hidden';

    // Get Name for filename
    const fullName = document.querySelector('input[name="fullName"]')?.value || 'Resume';
    const cleanName = fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // SCALING LOGIC:
    // We want to force fit into single page if possible.
    // 1mm = 3.78px
    const A4_HEIGHT_MM = 296; // slightly less than 297mm to be safe

    // Temporarily force height to auto to get actual content height for scaling calculation
    cvContainer.style.height = 'auto';
    cvContainer.style.maxHeight = 'none';
    cvContainer.style.overflow = 'visible';

    const contentHeight = cvContainer.scrollHeight;
    const contentHeightMM = contentHeight / 3.78;

    // Re-apply strict constraints for capture
    cvContainer.style.maxHeight = '296.5mm';
    cvContainer.style.overflow = 'hidden';

    let scaleFactor = 1;
    if (contentHeightMM > A4_HEIGHT_MM) {
        // Content exceeds one page. Scale to fit.
        // We add a tiny buffer (0.99) to ensure it's definitely smaller
        scaleFactor = (A4_HEIGHT_MM / contentHeightMM) * 0.99;

        // Cap the scaling so it doesn't get too tiny
        if (scaleFactor < 0.6) scaleFactor = 0.6;

        // Apply scaling
        cvContainer.style.transform = `scale(${scaleFactor})`;
        cvContainer.style.transformOrigin = 'top center';
    }

    const opt = {
        margin: 0,
        filename: `${cleanName}_cv.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 4, // Higher scale for ultra-sharp quality
            useCORS: true,
            letterRendering: true,
            logging: false,
            // Ensure the canvas is captured at the correct dimensions
            width: cvContainer.offsetWidth,
            windowWidth: cvContainer.offsetWidth,
            height: cvContainer.offsetHeight, // explicit height capture
            windowHeight: cvContainer.offsetHeight,
            scrollY: 0,
            scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Use html2pdf library
    html2pdf().set(opt).from(cvContainer).toPdf().get('pdf').then(function (pdf) {
        // Post-processing if needed
    }).save().then(() => {
        // 3. Restore original state
        previewPaper.style.transform = originalTransform;
        previewPaper.style.transformOrigin = originalTransformOrigin;
        cvContainer.style.width = originalWidth;
        cvContainer.style.margin = originalMargin;
        cvContainer.classList.remove('printing-mode');

        btn.innerHTML = originalText;
        btn.disabled = false;
    }).catch(err => {
        console.error('PDF Error:', err);

        // Restore on error too
        previewPaper.style.transform = originalTransform;
        previewPaper.style.transformOrigin = originalTransformOrigin;
        cvContainer.style.width = originalWidth;
        cvContainer.style.margin = originalMargin;
        cvContainer.classList.remove('printing-mode');

        alert('Error generating PDF. Please check console.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}
