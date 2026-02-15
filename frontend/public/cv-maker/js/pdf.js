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

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    const originalTransform = previewPaper.style.transform;
    const originalTransformOrigin = previewPaper.style.transformOrigin;
    const originalWidth = cvContainer.style.width;
    const originalMargin = cvContainer.style.margin;

    previewPaper.style.transform = 'none';
    previewPaper.style.transformOrigin = 'unset';

    cvContainer.classList.add('printing-mode');

    cvContainer.style.width = '209mm';
    cvContainer.style.margin = '0 auto';
    cvContainer.style.boxShadow = 'none';

    cvContainer.style.maxHeight = '296.5mm';
    cvContainer.style.overflow = 'hidden';

    const fullName = document.querySelector('input[name="fullName"]')?.value || 'Resume';
    const cleanName = fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const A4_HEIGHT_MM = 296;

    cvContainer.style.height = 'auto';
    cvContainer.style.maxHeight = 'none';
    cvContainer.style.overflow = 'visible';

    const contentHeight = cvContainer.scrollHeight;
    const contentHeightMM = contentHeight / 3.78;

    cvContainer.style.maxHeight = '296.5mm';
    cvContainer.style.overflow = 'hidden';

    let scaleFactor = 1;
    if (contentHeightMM > A4_HEIGHT_MM) {
        scaleFactor = (A4_HEIGHT_MM / contentHeightMM) * 0.99;
        if (scaleFactor < 0.6) scaleFactor = 0.6;

        cvContainer.style.transform = `scale(${scaleFactor})`;
        cvContainer.style.transformOrigin = 'top center';
    }

    const opt = {
        margin: 0,
        filename: `${cleanName}_cv.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 4,
            useCORS: true,
            letterRendering: true,
            logging: false,
            width: cvContainer.offsetWidth,
            windowWidth: cvContainer.offsetWidth,
            height: cvContainer.offsetHeight,
            windowHeight: cvContainer.offsetHeight,
            scrollY: 0,
            scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const html2pdf = window.html2pdf;
    if (!html2pdf) {
        alert('PDF export failed to load.');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    html2pdf().set(opt).from(cvContainer).toPdf().get('pdf').then(function () {
    }).save().then(() => {
        previewPaper.style.transform = originalTransform;
        previewPaper.style.transformOrigin = originalTransformOrigin;
        cvContainer.style.width = originalWidth;
        cvContainer.style.margin = originalMargin;
        cvContainer.classList.remove('printing-mode');

        btn.innerHTML = originalText;
        btn.disabled = false;
    }).catch(err => {
        previewPaper.style.transform = originalTransform;
        previewPaper.style.transformOrigin = originalTransformOrigin;
        cvContainer.style.width = originalWidth;
        cvContainer.style.margin = originalMargin;
        cvContainer.classList.remove('printing-mode');

        alert('Error generating PDF. Please check console.');
        btn.innerHTML = originalText;
        btn.disabled = false;
        console.error('PDF Error:', err);
    });
}

