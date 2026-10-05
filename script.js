// Loading Screen
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');

    // Add a minimum loading time for better UX
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');

        // Remove the loading screen from DOM after fade out
        setTimeout(() => {
            loadingScreen.remove();
            // Start text animations after loading screen is gone
            startTextAnimations();
        }, 500);
    }, 1000); // Minimum 1 second loading time
});

// Store original text content
let originalHeroText = '';
let originalSubtitleText = '';

// Show loading screen immediately if page is still loading
document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (document.readyState === 'loading') {
        loadingScreen.style.display = 'flex';
    }

    // Store and clear hero text during loading
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');

    if (heroTitle) {
        originalHeroText = heroTitle.innerHTML;
        heroTitle.innerHTML = '';
    }
    if (heroSubtitle) {
        originalSubtitleText = heroSubtitle.textContent;
        heroSubtitle.textContent = '';
    }
});

// Localization
const translations = {
    en: {
        'Graytitle': '[GrayZone]',
        'nav-about': 'About',
        'nav-team': 'Team',
        'nav-gallery': 'Gallery',
        'nav-tutorial': 'Game Tutorial',
        'nav-contact': 'Contact',
        'hero-title': 'Gray Zone',
        'hero-subtitle': 'Educational game for high schoolers.',
        'learn-more': 'Learn More',
        'get-in-touch': 'Get in Touch',
        'download': 'DOWNLOAD',
        'about': 'About the educational video game ,,Gray Zone“',
        'game-description': 'The player takes on the role of a high school senior on the path to education, where he will continue his studies and higher education. He receives a wonderful opportunity for a scholarship to a great university abroad, but the time to apply for the scholarship is short. To succeed, the player must go through a series of series and situations that look atreality - preparing documents, administrative, interviews with institutions and test questions. <br><br>At each step, the player is faced with a choice: to follow the honest path and put in the effort, or to choose which groups of positive practices at first glanceseem like a solution. The decisions they make lead the player through a ‘gray zone’ - a space in which the borderbetween ethically correct actions and illegal actions is unclear and difficult to demarcate.<br><br>Each choice has consequences based on the story and the final outcome: obtaining the scholarship in an honest way, dismiss opportunity, or achieve success through a group of practicesthat leave behind negative integrity scars.<br><br>The game offers multiple scenarios and endings that make it playful and interactive, and theresponse to critical thinking for young people about the importance of integrity, ethicalchoices and the consequences of corruption. The goals of the game that we strive to achieve are the following: <br><br>Young people are faced with real corrupt situations. Of course, critical thinking, moral assessment and active reflection on the decisions madeby each player. (In the process of playing, each player\'s integrity, reputation, time andmoney are measured). <br>Values ​​such as integrity, honesty and resistance to corruption are promoted.<br>A long-lasting resource which will be used in teaching and non-formal educational environments.',
        'team-title': 'Meet The Team of ,,Gray Zone“',
        'fitz-title': 'Game Developer',
        'aco-title': 'Game Developer',
        'hristina-title': 'Project Coordinator',
        'martin-title': 'Character Designer',
        'ognen-title': 'Public Relations Coordinator',
        'filip-title': 'Environment Designer',
        'mina-title': 'Educational Coordinator',
        'gallery': 'Gallery',
        'tutorial': 'Game Tutorial',
        'tutorial-step-1': 'Tutorial Step 1',
        'tutorial-step-2': 'Tutorial Step 2',
        'tutorial-step-3': 'Tutorial Step 3',
        'tutorial-step-4': 'Tutorial Step 4',
        'tutorial-step-5': 'Tutorial Step 5',
        'tutorial-step-6': 'Tutorial Step 6',
        'tutorial-step-7': 'Tutorial Step 7',
        'contactus': 'Get in Touch!',
        'contact-text': 'We always appreciate your honest feedback on our projects. Feel free to send us an email with your ideas! ',
        'fitz-bio': 'A passionate software engineer / video game developer with background in electronic music composition & sound design. Currently in the pursuit of a degree while working on creative projects that display art, technology, space and creativity. Background in both technical and artistic fields allows him to approach problems with unique perspectives and deliver elegant solutions. Additionally, he possesses skills such as 3D Modeling, 3D Rendering, Video Editing and Website Design.',
        'aco-bio': 'He is a programmer with a strong interest in gaming and interactive experiences. From an early age, video games have inspired his curiosity, not only as a player but also as a creator. He enjoys analyzing what makes games engaging and translating those ideas into his own concepts. Aside from writing code, he also has background in cybersecurity, which gives him new perceptions in the context of video game creation. Whether developing video games or similar projects, he always absorbs ideas from different projects.',
        'hristina-bio': 'Hristina is a project coordinator with proven experience in developing and leading youth initiatives aimed at social change. Within the project, she ensures overall strategic coordination – from planning and organizing activities to building partnerships and securing visibility. Her focus is on making project results practical, relevant, and recognized by the target group. With the ability to spot trends and translate them into engaging, educational content, she helps ensure the initiative is innovative and sustainable.',
        'martin-bio': 'Martin is a character designer focused on shaping the visual identity and individuality of game characters. From early sketches to finalized designs, he works on proportions, expressions, and details that give characters authenticity and recognizability. By balancing aesthetics with playability, he ensures that each character is both visually appealing and functional within animation and gameplay. His designs help players form emotional connections, adding depth and personality to the overall game experience.',
        'ognen-bio': 'Ognen is responsible for the communication and promotion of the initiative. He ensures project visibility through media coverage, collaboration with public figures and institutions, and active community engagement. He plans and coordinates all activities related to the communication strategy, making sure every message is precise, relevant, and aligned with the project’s values. With a systematic and professional approach, Ognen monitors campaign results and adapts strategies to increase impact and community engagement. Combining creativity with analytical thinking, he produces content that is striking, persuasive, and accessible to diverse audiences.',
        'filip-bio': 'Filip is a background designer focused on creating immersive environments and scenes that enrich the player experience. His work emphasizes spatial compositions and atmospheric design, carefully balancing aesthetics and functionality. From color choices and lighting effects to detailed elements, he ensures each background is vivid and engaging. A multimedia student passionate about game design, Filip combines creativity with strong technical and practical skills, delivering visual elements that are both harmonious and functional. His designs not only create a distinctive visual identity but also allow players to fully immerse themselves in the game world.',
        'mina-bio': 'Mina is a strategically oriented creative focused on developing and implementing content that is both engaging and directly applicable to the target audience. She carefully analyzes user needs and creates solutions that drive engagement and long-term value. She is dedicated to ensuring that every piece of content is interactive and easily accessible. Combining creativity, analytical thinking, and awareness of current trends, Mina ensures that projects are not only innovative but also effective in practice. Her dedication guarantees that every step of the process is well-planned and executed with structure.',
        'btn-dwn': 'Download',
        'game-tester-title': 'Game Testers',
        'game-tester-desc': 'Our dedicated game testing team ensures the highest quality gaming experience through rigorous testing, bug finding and overall feedback.<br><br> Special thanks to <b>Kristijan Srbinoski, Nikola Shikole, Zafir Bogdanovikj, Andrej Zlatanov and Hristijan Petkovski</b>.',
        'game-tester-subtitle': 'Testing',
        'fitz-ime': 'Filip Mladenovic',
        'aco-ime': 'Aleksandar Talevski',
        'hristina-ime': 'Hristina Jovcevska',
        'martin-ime': 'Martin Nasteski',
        'ognen-ime': 'Ognen Kiprijanoski',
        'filip-ime': 'Filip Simonovski',
        'mina-ime': 'Mina Zdravevska',
        'enter-mail': 'Enter your Email to Download',
        'testing': 'Testing',

        // NEW: Platform modal keys
        'choose-platform': 'Choose your platform',
        'mac-warning': 'On macOS, you may need to right-click → Open the first time and allow Gatekeeper.',
        'download-windows': 'Download for Windows',
        'download-mac': 'Download for macOS',
        'zafir-ime': 'Zafir Bogdanovikj',
        'zafir-title': 'Lead Game Tester',
        'zafir-bio': 'Zafir is the lead game tester behind GrayZone, responsible for testing the game throughout its development and helping the team identify bugs, gameplay issues, and areas for improvement. Through continuous testing and detailed feedback, he contributed to creating a smoother, more intuitive and engaging experience for players.',
    },
    mk: {
        'Graytitle': "[СиваЗона]",
        'nav-about': 'За нас',
        'nav-team': 'Тим',
        'nav-gallery': 'Галерија',
        'nav-tutorial': 'Упатство за играње',
        'nav-contact': 'Контакт',
        'hero-title': 'Сива Зона',
        'hero-subtitle': 'Едукативна игра за средношколци',
        'learn-more': 'Дознај повеќе',
        'get-in-touch': 'Контактирај нѐ',
        'download': 'ПРЕЗЕМИ',
        'about': ',,За едукативната електронска игра ,,Сива Зона“',
        'game-description': '<strong>За „Сива Зона“</strong><br>„Сива Зона“ е интерактивна едукативна игра која ја носи приказната на средношколец во последната година од своето образование. Играчот се најдува пред важен животен избор — каде и како ќе го продолжи своето образование. По добивање можност за стипендија на престижен универзитет во странство, времето за апликација е кратко и патот исполнет со предизвици.<br><br> Во играта, секој чекор носи избор: чесен пат, исполнет со труд и подготовка, или полесен пат преку коруптивни практики. Овие избори го водат играчот низ „сива зона“ — просторкаде границите меѓу етичкото и нелегалното се заматени. Секоја одлука има последици — од успех без компромис до губење на можноста, или постигнување на целта со негативни последици по интегритетот. Играта нуди повеќе сценарија и завршетоци, поттикнувајќи критичко размислување и развој на вредности како интегритет, чесност и отпор кон корупција. <br><br><strong>Цели на „Сива Зона“:</strong><br><li>Приказ на реални коруптивни ситуации и предизвици.</li><li>Поттикнување критичко размислување, морална проценка и рефлексија.</li><li>Поттикнување критичко размислување, морална проценка и рефлексија.</li><li>Создавање долготраен едукативен ресурс за формално и неформално учење.</li>',
        'team-title': "Запознај го тимот на ,,Сива Зона“",
        'fitz-title': 'Креатор',
        'aco-title': 'Креатор',
        'hristina-title': 'Координатор на проект',
        'martin-title': 'Дизајнер на карактери',
        'ognen-title': 'Координатор за односи со јавност',
        'filip-title': 'Дизајнер на позадини',
        'mina-title': 'Координатор на едукативни содржини',
        'gallery': 'Галерија',
        'tutorial': 'Упатство за играње',
        'tutorial-step-1': 'Упатство чекор 1',
        'tutorial-step-2': 'Упатство чекор 2',
        'tutorial-step-3': 'Упатство чекор 3',
        'tutorial-step-4': 'Упатство чекор 4',
        'tutorial-step-5': 'Упатство чекор 5',
        'tutorial-step-6': 'Упатство чекор 6',
        'tutorial-step-7': 'Упатство чекор 7',
        'contactus': 'Контактирај Нѐ!',
        'contact-text': 'Имаш прашање, предлог или идеја за подобрување на „Сива Зона“? Нашиот тим секогаш е отворен за соработка и нови иницијативи. Пиши ни – твоето мислење ни значи.“',
        'fitz-bio': 'Страствен софтверски инженер / развивач на видео игри со искуство во компонирање електронска музика и дизајн на звук. Моментално е во потрага по диплома, а воедно работи на креативни проекти кои прикажуваат уметност, технологија, простор и креативност. Искуството и во техничките и во уметничките области му овозможува да пристапува кон проблемите од уникатни перспективи и да нуди елегантни решенија. Дополнително, поседува вештини како што се 3Д моделирање, 3Д рендеринг, видео едитирање и дизајн на сајтови.',
        'aco-bio': 'Тој е програмер со силен интерес за игри и интерактивни искуства. Уште од рана возраст, видео игрите ја инспирирале неговата љубопитност, не само како играч, туку и како креатор. Ужива во анализа на она што ги прави игрите привлечни и во преведување на тие идеи во свои концепти. Освен пишување код, тој има и искуство во сајбер безбедноста, што му дава нови перцепции во контекст на креирање видео игри. Без разлика дали развива видео игри или слични проекти, тој секогаш апсорбира идеи од различни проекти.',
        'hristina-bio': 'Христина е координатор на проекти со докажано искуство во развивање и водење на младински иницијативи насочени кон општествени промени. Во рамките на проектот, таа обезбедува целокупна стратешка координација - од планирање и организирање активности до градење партнерства и обезбедување видливост. Нејзиниот фокус е на тоа резултатите од проектот да бидат практични, релевантни и препознаени од целната група. Со способноста да ги забележува трендовите и да ги преточи во ангажирачка, едукативна содржина, таа помага да се осигури дека иницијативата е иновативна и одржлива.',
        'martin-bio': 'Мартин е дизајнер на ликови фокусиран на обликување на визуелниот идентитет и индивидуалноста на ликовите во играта. Од раните скици до финализираните дизајни, тој работи на пропорции, изрази и детали што им даваат автентичност и препознатливост на ликовите. Со балансирање на естетиката со можноста за играње, тој гарантира дека секој лик е визуелно привлечен и функционален во анимацијата и играта. Неговите дизајни им помагаат на играчите да формираат емоционални врски, додавајќи длабочина и личност на целокупното искуство во играта.',
        'ognen-bio': 'Огнен е одговорен за комуникацијата и промоцијата на иницијативата. Тој обезбедува видливост на проектот преку медиумско покривање, соработка со јавни личности и институции и активно вклучување на заедницата. Тој ги планира и координира сите активности поврзани со комуникациската стратегија, осигурувајќи се дека секоја порака е прецизна, релевантна и усогласена со вредностите на проектот. Со систематски и професионален пристап, Огнен ги следи резултатите од кампањата и ги прилагодува стратегиите за да го зголеми влијанието и ангажирањето на заедницата. Комбинирајќи ја креативноста со аналитичкото размислување, тој создава содржина што е впечатлива, убедлива и достапна за разновидна публика.',
        'filip-bio': 'Филип е дизајнер на позадини фокусиран на создавање импресивни средини и сцени што го збогатуваат искуството на играчот. Неговата работа нагласува просторни композиции и атмосферски дизајн, внимателно балансирајќи ја естетиката и функционалноста. Од изборот на бои и светлосни ефекти до деталните елементи, тој се грижи секоја позадина да биде живописна и привлечна. Како мултимедијален студент страствен за дизајн на игри, Филип ја комбинира креативноста со силни технички и практични вештини, испорачувајќи визуелни елементи кои се хармонични и функционални. Неговите дизајни не само што создаваат препознатлив визуелен идентитет, туку им овозможуваат и на играчите целосно да се потопат во светот на играта.',
        'mina-bio': 'Мина е стратешки ориентирана креативка фокусирана на развој и имплементација на содржина што е ангажирачка и директно применлива за целната публика. Таа внимателно ги анализира потребите на корисниците и создава решенија што го поттикнуваат ангажманот и долгорочната вредност. Таа е посветена на тоа да се осигура дека секоја содржина е интерактивна и лесно достапна. Комбинирајќи креативност, аналитичко размислување и свест за актуелните трендови, Мина гарантира дека проектите се не само иновативни, туку и ефикасни во пракса. Нејзината посветеност гарантира дека секој чекор од процесот е добро испланиран и структурирано извршен.',
        'btn-dwn': 'Преземи',
        'game-tester-title': 'Тестери на играта',
        'game-tester-desc': 'Нашиот посветен тим за тестирање на игри обезбеди искуство со играње со највисок квалитет преку ригорозно тестирање, откривање грешки и целокупни повратни информации.<br><br> Посебна благодарност до <b>Кристијан Србиноски, Никола Шиколе, Зафир Богдановиќ, Андреј Златанов и Христијан Петковски</b>.',
        'game-tester-subtitle:': 'Тестирање',
        'fitz-ime': 'Филип Младенович',
        'aco-ime': 'Александар Талевски',
        'hristina-ime': 'Христина Јовчевска',
        'martin-ime': 'Мартин Настески',
        'ognen-ime': 'Огнен Кипријаноски',
        'filip-ime': 'Филип Симоновски',
        'mina-ime': 'Мина Здравевска',
        'enter-mail': 'Внеси ја твојата мејл адреса за да ја симнеш играта',
        'testing': 'Тестирање',

        // NEW: Platform modal keys
        'choose-platform': 'Изберете платформа',
        'mac-warning': 'На macOS можеби ќе треба првпат десен клик → Open и дозвола преку Gatekeeper.',
        'download-windows': 'Преземи за Windows',
        'download-mac': 'Преземи за macOS',
        'zafir-ime': 'Зафир Богдановиќ',
        'zafir-title': 'Главен тестер на играта',
        'zafir-bio': 'Зафир е главен тестер на „Сива зона“, одговорен за тестирање на играта во текот на нејзиниот развој и идентификување технички недостатоци, проблеми во гејмплејот и можности за подобрување. Преку континуирано тестирање и детални повратни информации, придонесува кон создавање пофункционално, интуитивно и интересно искуство за играчите.'
    }
};

let currentLanguage = 'en';

function updateLanguage(lang) {
    currentLanguage = lang;

    // Update navigation links and any [data-key]
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang][key]) {
            // Use innerHTML for keys that contain HTML tags
            if (key === 'game-description' || key === 'game-tester-desc') {
                element.innerHTML = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Update hero section
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const learnMoreBtn = document.querySelector('.hero .btn-primary');
    const getInTouchBtn = document.querySelector('.hero .btn-secondary');
    const downloadBtn = document.querySelector('.btn-download');

    if (heroTitle) heroTitle.innerHTML = translations[lang]['hero-title'];
    if (heroSubtitle) heroSubtitle.textContent = translations[lang]['hero-subtitle'];
    if (learnMoreBtn) learnMoreBtn.textContent = translations[lang]['learn-more'];
    if (getInTouchBtn) getInTouchBtn.textContent = translations[lang]['get-in-touch'];
    if (downloadBtn) downloadBtn.textContent = translations[lang]['download'];

    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });

    // Update tutorial images based on language
    document.querySelectorAll('.tutorial-image').forEach(img => {
        const enSrc = img.getAttribute('data-en');
        const mkSrc = img.getAttribute('data-mk');

        if (lang === 'en' && enSrc) {
            img.src = enSrc;
        } else if (lang === 'mk' && mkSrc) {
            img.src = mkSrc;
        }
    });
}

// Language switcher event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Default to English (no saved preferences)
    updateLanguage('en');

    // Add click listeners to language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            updateLanguage(lang);
        });
    });
});
// Mobile navigation toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Allow modal buttons with href="#" to be handled separately
        const href = this.getAttribute('href');
        if (!href || href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background opacity on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(13, 17, 23, 0.98)';
    } else {
        navbar.style.backgroundColor = 'rgba(13, 17, 23, 0.95)';
    }
});

// Gallery and Tutorial lightbox functionality
const galleryItems = document.querySelectorAll('.gallery-item, .tutorial-item');
let currentImageIndex = 0;

// Create lightbox modal
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = `
    <div class="lightbox-content">
        <span class="lightbox-close">&times;</span>
        <img class="lightbox-image" src="" alt="">
        <div class="lightbox-nav">
            <button class="lightbox-prev">&#10094;</button>
            <button class="lightbox-next">&#10095;</button>
        </div>
    </div>
`;
document.body.appendChild(lightbox);

// Lightbox styles
const lightboxStyles = `
    .lightbox {
        display: none;
        position: fixed;
        z-index: 2000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(5px);
    }
    
    .lightbox-content {
        position: relative;
        margin: auto;
        padding: 20px;
        width: 90%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .lightbox-image {
        max-width: 100%;
        max-height: 80%;
        object-fit: contain;
        border-radius: 8px;
    }
    
    .lightbox-close {
        position: absolute;
        top: 20px;
        right: 35px;
        color: #fff;
        font-size: 40px;
        font-weight: bold;
        cursor: pointer;
        z-index: 2001;
    }
    
    .lightbox-close:hover {
        color: var(--accent-primary);
    }
    
    .lightbox-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
        display: flex;
        justify-content: space-between;
        padding: 0 20px;
        pointer-events: none;
    }
    
    .lightbox-prev,
    .lightbox-next {
        background: rgba(166, 246, 92, 0.8);
        color: white;
        border: none;
        padding: 15px 20px;
        font-size: 18px;
        cursor: pointer;
        border-radius: 5px;
        pointer-events: all;
        transition: background-color 0.3s ease;
    }
    
    .lightbox-prev:hover,
    .lightbox-next:hover {
        background: rgba(136, 246, 92, 1);
    }
    
    @media (max-width: 768px) {
        .lightbox-prev,
        .lightbox-next {
            padding: 10px 15px;
            font-size: 16px;
        }
        
        .lightbox-close {
            font-size: 30px;
            right: 20px;
        }
    }
`;

// Add lightbox styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = lightboxStyles;
document.head.appendChild(styleSheet);

// Gallery click handlers
galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        currentImageIndex = index;
        openLightbox();
    });
});

// Lightbox functionality
const lightboxImage = lightbox.querySelector('.lightbox-image');
const lightboxClose = lightbox.querySelector('.lightbox-close');
const lightboxPrev = lightbox.querySelector('.lightbox-prev');
const lightboxNext = lightbox.querySelector('.lightbox-next');

function openLightbox() {
    // Get the actual image source from the clicked gallery item
    const galleryImg = galleryItems[currentImageIndex].querySelector('img');
    const imageSrc = galleryImg ? galleryImg.src : '';
    lightboxImage.src = imageSrc;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showPrevImage() {
    currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : galleryItems.length - 1;
    const galleryImg = galleryItems[currentImageIndex].querySelector('img');
    const imageSrc = galleryImg ? galleryImg.src : '';
    lightboxImage.src = imageSrc;
}

function showNextImage() {
    currentImageIndex = currentImageIndex < galleryItems.length - 1 ? currentImageIndex + 1 : 0;
    const galleryImg = galleryItems[currentImageIndex].querySelector('img');
    const imageSrc = galleryImg ? galleryImg.src : '';
    lightboxImage.src = imageSrc;
}

// Event listeners
lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', showPrevImage);
lightboxNext.addEventListener('click', showNextImage);

// Close lightbox when clicking outside the image
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (lightbox.style.display === 'block') {
        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                showPrevImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
        }
    }
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Add animation styles and observe elements
const animatedElements = document.querySelectorAll('.project-card, .gallery-item, .tutorial-item, .about-content');
animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Add typing effect to hero title with HTML support
function typeWriter(element, htmlText, speed = 100) {
    // Parse HTML to separate text from tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;

    // Extract just the text content for typing
    const textContent = tempDiv.textContent || tempDiv.innerText;

    // Find where the accent span should start and end
    const accentMatch = htmlText.match(/<span class="accent">(.*?)<\/span>/);
    let accentStart = -1;
    let accentEnd = -1;

    if (accentMatch) {
        const beforeAccent = htmlText.substring(0, htmlText.indexOf('<span class="accent">'));
        const tempBefore = document.createElement('div');
        tempBefore.innerHTML = beforeAccent;
        accentStart = (tempBefore.textContent || tempBefore.innerText).length;
        accentEnd = accentStart + accentMatch[1].length;
    }

    let i = 0;
    element.innerHTML = '';

    function type() {
        if (i < textContent.length) {
            const currentChar = textContent.charAt(i);

            // Build the current text
            let currentText = textContent.substring(0, i + 1);

            // Apply accent span if we're in the accent range
            if (accentStart >= 0 && accentEnd >= 0) {
                if (i + 1 > accentStart) {
                    const beforeAccent = currentText.substring(0, accentStart);
                    const accentPart = currentText.substring(accentStart, Math.min(i + 1, accentEnd));
                    const afterAccent = currentText.substring(accentEnd);

                    if (i + 1 <= accentEnd) {
                        currentText = beforeAccent + '<span class="accent">' + accentPart + '</span>' + afterAccent;
                    } else {
                        const fullAccentText = textContent.substring(accentStart, accentEnd);
                        currentText = beforeAccent + '<span class="accent">' + fullAccentText + '</span>' + afterAccent;
                    }
                }
            }

            element.innerHTML = currentText;
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// Function to start text animations after loading screen
function startTextAnimations() {
    const heroTitle = document.querySelector('.hero-title');
    const underTitle = document.querySelector('.hero-subtitle');

    // Use stored original text or fallback to default
    const originalText = originalHeroText || 'Hello, We are the <span class="accent">GrayZone Team</span>';
    const underText = originalSubtitleText || 'Team full of creative people.';

    // Start typing the main title
    typeWriter(heroTitle, originalText, 50);
    underTitle.textContent = '...';

    // Start typing the subtitle after main title
    setTimeout(() => {
        typeWriter(underTitle, underText, 20);
    }, 2000);
}

// Add particle effect to hero section
function createParticles() {
    const hero = document.querySelector('.hero');
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    particlesContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
    `;

    hero.appendChild(particlesContainer);

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(246, 115, 92, 0.5);
            border-radius: 50%;
            animation: float ${Math.random() * 3 + 2}s ease-in-out infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 2}s;
        `;
        particlesContainer.appendChild(particle);
    }
}

// Add floating animation keyframes
const particleStyles = `
    @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.5; }
        50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
    }
`;

const particleStyleSheet = document.createElement('style');
particleStyleSheet.textContent = particleStyles;
document.head.appendChild(particleStyleSheet);

// Initialize particles
createParticles();


// =====================================================================
// DOWNLOAD: Platform chooser modal (auto-insert + wiring)
// =====================================================================
document.addEventListener('DOMContentLoaded', function () {
    const heroDownloadBtn = document.querySelector('.btn-download');

    // Direct release asset links (from you)
    const RELEASE_LINKS = {
        windows: 'https://github.com/alrk855/GrayZone/releases/download/v.1.0.1/GrayZoneWin.zip',
        mac:     'https://github.com/alrk855/GrayZone/releases/download/v.1.0.1/GrayZoneMac.zip'
    };

    // 1) Ensure a platform modal exists; if not, create one that reuses your classes
    let platformOverlay = document.getElementById('platform-overlay');
    if (!platformOverlay) {
        platformOverlay = document.createElement('div');
        platformOverlay.id = 'platform-overlay';
        platformOverlay.className = 'popup-overlay';
        platformOverlay.innerHTML = `
          <div class="popup small">
            <button class="close-btn platform-close" aria-label="Close">&times;</button>
            <h2 data-key="choose-platform">Choose your platform</h2>
            <p class="warn" data-key="mac-warning">
              On macOS, you may need to right-click → Open the first time and allow Gatekeeper.
            </p>
            <div class="btn-row">
              <a href="#" id="dl-windows" class="btn btn-primary" data-key="download-windows">Download for Windows</a>
              <a href="#" id="dl-mac" class="btn btn-secondary" data-key="download-mac">Download for macOS</a>
            </div>
          </div>
        `;
        // Insert next to your existing popup to inherit stacking order
        const main = document.querySelector('main') || document.body;
        main.appendChild(platformOverlay);
        // Localize freshly inserted nodes
        updateLanguage(currentLanguage);
    }

    const platformClose = platformOverlay.querySelector('.platform-close');
    const dlWinBtn = platformOverlay.querySelector('#dl-windows');
    const dlMacBtn = platformOverlay.querySelector('#dl-mac');

    // Optional small CSS helpers (only once)
    const addOnce = (id, css) => {
        if (!document.getElementById(id)) {
            const s = document.createElement('style');
            s.id = id;
            s.textContent = css;
            document.head.appendChild(s);
        }
    };
    addOnce('platform-modal-css', `
        .popup.small { max-width: 480px; }
        .popup .btn-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
        .popup .warn { margin-top: 8px; opacity: 0.9; font-size: 0.95em; }
    `);

    // 2) Open platform chooser instead of any previous email gate
    heroDownloadBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        platformOverlay.classList.add('active'); // your email popup uses 'active', so we do the same
    });

    // 3) Close behavior
    platformClose?.addEventListener('click', () => platformOverlay.classList.remove('active'));
    platformOverlay.addEventListener('click', (e) => {
        if (e.target === platformOverlay) platformOverlay.classList.remove('active');
    });

    // 4) Direct download actions (same tab to avoid popup blockers)
    dlWinBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        platformOverlay.classList.remove('active');
        window.location.href = RELEASE_LINKS.windows;
    });

    dlMacBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        platformOverlay.classList.remove('active');
        window.location.href = RELEASE_LINKS.mac;
    });
});
