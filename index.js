const { jsPDF } = window.jspdf;

const preview = document.getElementById('preview');
const imageUpload = document.getElementById('imageUpload');
const addImageButton = document.getElementById('addImageButton');
const generatePdfButton = document.getElementById('generatePdfButton');
const images = [];

const ordenInput = document.getElementById('orden');
const plantaInput = document.getElementById('planta');
const dateInput = document.getElementById('date');
const companyInput = document.getElementById('company');
const responsibleInput = document.getElementById('responsible');
const captureInput = document.getElementById('capture');
const spinner = document.getElementById('spinner');

const ordenError = document.getElementById('order-error');
const plantaError = document.getElementById('planta-error');
const dateError = document.getElementById('date-error');
const companyError = document.getElementById('company-error');
const responsibleError = document.getElementById('responsible-error');
const captureError = document.getElementById('capture-error');

const logo = './logo.png';

const maxNumberOfImages = 18;
addImageButton.addEventListener('click', () => {
    if (images.length >= maxNumberOfImages) {
        alert('Solo puedes subir un máximo de 6 imágenes');
        return;
    }
    imageUpload.click();
});

imageUpload.addEventListener('change', (event) => {
    const files = event.target.files;
    const maxFiles = maxNumberOfImages - images.length;

    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = (function (file) {
            return function (e) {
                const imageSrc = e.target.result;
                const image = document.createElement('div');
                image.classList.add('position-relative', 'd-inline-block', 'm-2');

                const imgElement = document.createElement('img');
                imgElement.src = imageSrc;
                imgElement.classList.add('img-fluid', 'rounded');

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete', 'btn', 'btn-danger', 'btn-sm', 'position-absolute', 'top-0', 'end-0');
                deleteButton.type = 'button';
                deleteButton.innerHTML = '&times;';
                deleteButton.addEventListener('click', (event) => {
                    if (confirm('¿Estás seguro de borrar la fotografía?')) {
                        const imgContainer = event.target.parentElement;
                        preview.removeChild(imgContainer);
                        const imgSrc = imgContainer.querySelector('img').src;
                        const index = images.indexOf(imgSrc);
                        if (index > -1) {
                            images.splice(index, 1);
                        }
                        if (images.length < maxNumberOfImages) {
                            addImageButton.disabled = false;
                        }
                    }
                });

                image.appendChild(imgElement);
                image.appendChild(deleteButton);
                preview.appendChild(image);

                images.push(imageSrc);
                if (images.length >= maxNumberOfImages) {
                    addImageButton.disabled = true;
                }
            };
        })(file);

        reader.readAsDataURL(file);
    }
});

generatePdfButton.addEventListener('click', () => {
    showSpinner();
    setTimeout(async () => {
        await generatePDF();
        hideSpinner();
    }, 1000);
});

async function generatePDF() {
    const orden = ordenInput.value;
    const date = dateInput.value.replaceAll("-", '_');
    const planta = plantaInput.value;
    const company = companyInput.value;
    const responsible = responsibleInput.value;
    const capture = captureInput.value;

    if (!orden.length) {
        ordenError.style.display = '';
    } else {
        ordenError.style.display = 'none';
    }

    if (!date.length) {
        dateError.style.display = '';
    } else {
        dateError.style.display = 'none';
    }

    if (!planta.length) {
        plantaError.style.display = '';
    } else {
        plantaError.style.display = 'none';
    }

    if (!company.length) {
        companyError.style.display = '';
    } else {
        companyError.style.display = 'none';
    }

    if (!responsible.length) {
        responsibleError.style.display = '';
    } else {
        responsibleError.style.display = 'none';
    }

    if (!capture.length) {
        captureError.style.display = '';
    } else {
        captureError.style.display = 'none';
    }

    if (images.length === 0) {
        alert('Por favor, sube al menos una imagen');
        return;
    }

    if (
        !orden.length ||
        !date.length ||
        !planta.length ||
        !responsible.length ||
        !company.length ||
        !capture.length
    ) {
        alert('Por favor, completa todos los campos');
        return;
    }

    const fileName = `OT ${planta} ${orden} ${date} ${company}`.toUpperCase();

    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFontSize(8);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imageWidth = (pageWidth - margin * 3) / 2;
    const imageHeight = (pageHeight - margin * 3 - 30) / 3;
    const logoWidth = 30;
    const logoHeight = 10;
    let x = margin / 2;
    let y = margin + logoHeight + 5;

    const addLogo = () => {
        pdf.addImage(logo, 'PNG', margin, margin, logoWidth, logoHeight, undefined, 'FAST');
        
        pdf.text(`No Orden de Trabajo: ${orden}`, margin + 45, margin + 2, { align: 'left' });
        pdf.text(`Fecha: ${date}`, margin + 45, margin + 6, { align: 'left' });

        pdf.text(`Compañia: ${company} / Persona que captura: ${capture}`, margin + 100, margin + 2, { align: 'left' });
        pdf.text(`Responsable CEMOSA: ${responsible}`, margin + 100, margin + 6, { align: 'left' });
    };

    addLogo();

    for (let i = 0; i < images.length; i++) {
        if (i % 2 === 0 && i !== 0) {
            x = margin;
            y += imageHeight + margin;
        } else if (i % 2 !== 0) {
            x = pageWidth / 2 + margin / 2;
        }

        if (i > 0 && i % 6 === 0) {
            pdf.addPage();
            addLogo();
            x = margin;
            y = margin + logoHeight + 5;
        }

        pdf.addImage(images[i], 'JPEG', x, y, imageWidth, imageHeight, undefined, 'FAST');
    }

    preview.innerHTML = '';
    images.length = 0;
    addImageButton.disabled = false;
    orden.value = '';
    date.value = '';
    planta.value = '';
    company.value = '';
    responsible.value = '';

    pdf.save(`${fileName}.pdf`);

    if (confirm('¿Deseas enviar correo para la recepción de tus evidencias?')) {
        const pdfBlob = pdf.output('blob');

        setTimeout(async () => {
            await sendPdfByEmail(pdfBlob, fileName);
            hideSpinner();
        }, 1000);
    }
}

function showSpinner() {
    spinner.style.display = 'block';
}

function hideSpinner() {
    spinner.style.display = 'none';
}

async function sendPdfByEmail(pdfBlob, fileName) {
    const formData = new FormData();
    formData.append('file', pdfBlob, `${fileName}.pdf`);
    await fetch(`https://jedilbertotc.somee.com/api/v1/Email/SendEmail?subject=${fileName}`, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
    });
}