import type { ImageMetadata } from 'astro';
import type { Localized } from '../i18n/config';
import teamPhotoSrc from '../assets/team/team.jpg';

export type TeamLinkKind = 'instagram' | 'youtube' | 'github' | 'spotify' | 'linkedin' | 'email';

export interface TeamMember {
  id: string;
  name: Localized<string>;
  role: Localized<string>;
  /** Plain text; paragraphs are separated by a blank line (`\n\n`). */
  bio: Localized<string>;
  tags: string[];
  links: {
    kind: TeamLinkKind;
    href: string;
  }[];
}

export const teamPhoto: ImageMetadata = teamPhotoSrc;

export interface TeamCopy {
  title: string;
  /** Under the title: how to work the roster. */
  hint: string;
  photoAlt: string;
  /** Names each link in a member's file. */
  links: Record<TeamLinkKind, string>;
}

export const teamCopy: Localized<TeamCopy> = {
  en: {
    title: 'Meet the team of „Gray Zone“',
    hint: 'Open a file to read who did what.',
    photoAlt: 'The Gray Zone team in their Gray Zone T-shirts',
    links: { instagram: 'Instagram', youtube: 'YouTube', github: 'GitHub', spotify: 'Spotify', linkedin: 'LinkedIn', email: 'Email' },
  },
  mk: {
    title: 'Запознај го тимот на „Сива Зона“',
    hint: 'Отвори досие и прочитај кој што направил.',
    photoAlt: 'Тимот на „Сива Зона“ во маици со логото на играта',
    links: { instagram: 'Instagram', youtube: 'YouTube', github: 'GitHub', spotify: 'Spotify', linkedin: 'LinkedIn', email: 'Е-пошта' },
  },
};

export const team: TeamMember[] = [
  {
    id: 'filip-mladenovic',
    name: { en: 'Filip Mladenovic', mk: 'Филип Младенович' },
    role: { en: 'Game Developer', mk: 'Креатор' },
    bio: {
      en: 'A passionate software engineer / video game developer with background in electronic music composition & sound design. Currently in the pursuit of a degree while working on creative projects that display art, technology, space and creativity. Background in both technical and artistic fields allows him to approach problems with unique perspectives and deliver elegant solutions. Additionally, he possesses skills such as 3D Modeling, 3D Rendering, Video Editing and Website Design.',
      mk: 'Страствен софтверски инженер / развивач на видео игри со искуство во компонирање електронска музика и дизајн на звук. Моментално е во потрага по диплома, а воедно работи на креативни проекти кои прикажуваат уметност, технологија, простор и креативност. Искуството и во техничките и во уметничките области му овозможува да пристапува кон проблемите од уникатни перспективи и да нуди елегантни решенија. Дополнително, поседува вештини како што се 3Д моделирање, 3Д рендеринг, видео едитирање и дизајн на сајтови.',
    },
    tags: ['Programmer', 'Music', 'SFX', 'UI/UX', 'Website Creator', 'Concept Creator'],
    links: [
      { kind: 'instagram', href: 'https://www.instagram.com/f_mladenovic1/' },
      { kind: 'youtube', href: 'https://www.youtube.com/@ostaver3360' },
      { kind: 'github', href: 'https://github.com/ostaver' },
      { kind: 'spotify', href: 'https://open.spotify.com/artist/0k3Dbqswi4TFGMsB77ydBD' },
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/filip-karamazov-a724b7386/' },
      { kind: 'email', href: 'mailto:filipmladenovik@sivazona.mk' },
    ],
  },
  {
    id: 'aleksandar-talevski',
    name: { en: 'Aleksandar Talevski', mk: 'Александар Талевски' },
    role: { en: 'Game Developer', mk: 'Креатор' },
    bio: {
      en: 'He is a programmer with a strong interest in gaming and interactive experiences. From an early age, video games have inspired his curiosity, not only as a player but also as a creator. He enjoys analyzing what makes games engaging and translating those ideas into his own concepts. Aside from writing code, he also has background in cybersecurity, which gives him new perceptions in the context of video game creation. Whether developing video games or similar projects, he always absorbs ideas from different projects.',
      mk: 'Тој е програмер со силен интерес за игри и интерактивни искуства. Уште од рана возраст, видео игрите ја инспирирале неговата љубопитност, не само како играч, туку и како креатор. Ужива во анализа на она што ги прави игрите привлечни и во преведување на тие идеи во свои концепти. Освен пишување код, тој има и искуство во сајбер безбедноста, што му дава нови перцепции во контекст на креирање видео игри. Без разлика дали развива видео игри или слични проекти, тој секогаш апсорбира идеи од различни проекти.',
    },
    tags: ['Concept Creator', 'UI/UX', 'Programmer'],
    links: [
      { kind: 'instagram', href: 'https://www.instagram.com/t__aleksandar/' },
      { kind: 'github', href: 'https://github.com/alrk855' },
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/aleksandar-talevski-185091386/' },
      { kind: 'email', href: 'mailto:aleksandartalevski@sivazona.mk' },
    ],
  },
  {
    id: 'hristina-jovcevska',
    name: { en: 'Hristina Jovcevska', mk: 'Христина Јовчевска' },
    role: { en: 'Project Coordinator', mk: 'Координатор на проект' },
    bio: {
      en: 'Hristina is a project coordinator with proven experience in developing and leading youth initiatives aimed at social change. Within the project, she ensures overall strategic coordination – from planning and organizing activities to building partnerships and securing visibility. Her focus is on making project results practical, relevant, and recognized by the target group. With the ability to spot trends and translate them into engaging, educational content, she helps ensure the initiative is innovative and sustainable.',
      mk: 'Христина е координатор на проекти со докажано искуство во развивање и водење на младински иницијативи насочени кон општествени промени. Во рамките на проектот, таа обезбедува целокупна стратешка координација - од планирање и организирање активности до градење партнерства и обезбедување видливост. Нејзиниот фокус е на тоа резултатите од проектот да бидат практични, релевантни и препознаени од целната група. Со способноста да ги забележува трендовите и да ги преточи во ангажирачка, едукативна содржина, таа помага да се осигури дека иницијативата е иновативна и одржлива.',
    },
    tags: ['Concept Creator', 'Event Manager'],
    links: [
      { kind: 'instagram', href: 'https://www.instagram.com/_j.hristina__/' },
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/hristina-jovcevska-3a0428263/' },
      { kind: 'email', href: 'mailto:hristinajovcevska@sivazona.mk' },
    ],
  },
  {
    id: 'martin-nasteski',
    name: { en: 'Martin Nasteski', mk: 'Мартин Настески' },
    role: { en: 'Character Designer', mk: 'Дизајнер на карактери' },
    bio: {
      en: 'Martin is a character designer focused on shaping the visual identity and individuality of game characters. From early sketches to finalized designs, he works on proportions, expressions, and details that give characters authenticity and recognizability. By balancing aesthetics with playability, he ensures that each character is both visually appealing and functional within animation and gameplay. His designs help players form emotional connections, adding depth and personality to the overall game experience.',
      mk: 'Мартин е дизајнер на ликови фокусиран на обликување на визуелниот идентитет и индивидуалноста на ликовите во играта. Од раните скици до финализираните дизајни, тој работи на пропорции, изрази и детали што им даваат автентичност и препознатливост на ликовите. Со балансирање на естетиката со можноста за играње, тој гарантира дека секој лик е визуелно привлечен и функционален во анимацијата и играта. Неговите дизајни им помагаат на играчите да формираат емоционални врски, додавајќи длабочина и личност на целокупното искуство во играта.',
    },
    tags: ['Artist', 'Character Artist'],
    links: [
      { kind: 'instagram', href: 'https://www.instagram.com/nasteskimartin/' },
      // TODO(client): this LinkedIn slug (filip-mladenovic) looks like Filip M.'s, not Martin's — confirm the correct profile.
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/filip-mladenovic/' },
      { kind: 'email', href: 'mailto:martinnasteski@sivazona.mk' },
    ],
  },
  {
    id: 'ognen-kiprijanoski',
    name: { en: 'Ognen Kiprijanoski', mk: 'Огнен Кипријаноски' },
    role: { en: 'Public Relations Coordinator', mk: 'Координатор за односи со јавност' },
    bio: {
      en: 'Ognen is responsible for the communication and promotion of the initiative. He ensures project visibility through media coverage, collaboration with public figures and institutions, and active community engagement. He plans and coordinates all activities related to the communication strategy, making sure every message is precise, relevant, and aligned with the project’s values. With a systematic and professional approach, Ognen monitors campaign results and adapts strategies to increase impact and community engagement. Combining creativity with analytical thinking, he produces content that is striking, persuasive, and accessible to diverse audiences.',
      mk: 'Огнен е одговорен за комуникацијата и промоцијата на иницијативата. Тој обезбедува видливост на проектот преку медиумско покривање, соработка со јавни личности и институции и активно вклучување на заедницата. Тој ги планира и координира сите активности поврзани со комуникациската стратегија, осигурувајќи се дека секоја порака е прецизна, релевантна и усогласена со вредностите на проектот. Со систематски и професионален пристап, Огнен ги следи резултатите од кампањата и ги прилагодува стратегиите за да го зголеми влијанието и ангажирањето на заедницата. Комбинирајќи ја креативноста со аналитичкото размислување, тој создава содржина што е впечатлива, убедлива и достапна за разновидна публика.',
    },
    tags: ['Socials Coordinator'],
    links: [
      { kind: 'instagram', href: 'https://www.instagram.com/ognenkiprijanovski/' },
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/ognen-kiprijanovski-12b975385/' },
      { kind: 'email', href: 'mailto:ognenkiprijanovski@sivazona.mk' },
    ],
  },
  {
    id: 'filip-simonovski',
    name: { en: 'Filip Simonovski', mk: 'Филип Симоновски' },
    role: { en: 'Environment Designer', mk: 'Дизајнер на позадини' },
    bio: {
      en: 'Filip is a background designer focused on creating immersive environments and scenes that enrich the player experience. His work emphasizes spatial compositions and atmospheric design, carefully balancing aesthetics and functionality. From color choices and lighting effects to detailed elements, he ensures each background is vivid and engaging. A multimedia student passionate about game design, Filip combines creativity with strong technical and practical skills, delivering visual elements that are both harmonious and functional. His designs not only create a distinctive visual identity but also allow players to fully immerse themselves in the game world.',
      mk: 'Филип е дизајнер на позадини фокусиран на создавање импресивни средини и сцени што го збогатуваат искуството на играчот. Неговата работа нагласува просторни композиции и атмосферски дизајн, внимателно балансирајќи ја естетиката и функционалноста. Од изборот на бои и светлосни ефекти до деталните елементи, тој се грижи секоја позадина да биде живописна и привлечна. Како мултимедијален студент страствен за дизајн на игри, Филип ја комбинира креативноста со силни технички и практични вештини, испорачувајќи визуелни елементи кои се хармонични и функционални. Неговите дизајни не само што создаваат препознатлив визуелен идентитет, туку им овозможуваат и на играчите целосно да се потопат во светот на играта.',
    },
    tags: ['Artist', 'Background Designer'],
    links: [
      { kind: 'instagram', href: 'https://www.instagram.com/black_birdfs/' },
      // TODO(client): this LinkedIn slug (filip-karamazov) is identical to Filip M.'s link — confirm the correct profile for Filip S.
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/filip-karamazov-a724b7386/' },
      { kind: 'email', href: 'mailto:filipsimonovski@sivazona.mk' },
    ],
  },
  {
    id: 'mina-zdravevska',
    name: { en: 'Mina Zdravevska', mk: 'Мина Здравевска' },
    role: { en: 'Educational Coordinator', mk: 'Координатор на едукативни содржини' },
    bio: {
      en: 'Mina is a strategically oriented creative focused on developing and implementing content that is both engaging and directly applicable to the target audience. She carefully analyzes user needs and creates solutions that drive engagement and long-term value. She is dedicated to ensuring that every piece of content is interactive and easily accessible. Combining creativity, analytical thinking, and awareness of current trends, Mina ensures that projects are not only innovative but also effective in practice. Her dedication guarantees that every step of the process is well-planned and executed with structure.',
      mk: 'Мина е стратешки ориентирана креативка фокусирана на развој и имплементација на содржина што е ангажирачка и директно применлива за целната публика. Таа внимателно ги анализира потребите на корисниците и создава решенија што го поттикнуваат ангажманот и долгорочната вредност. Таа е посветена на тоа да се осигура дека секоја содржина е интерактивна и лесно достапна. Комбинирајќи креативност, аналитичко размислување и свест за актуелните трендови, Мина гарантира дека проектите се не само иновативни, туку и ефикасни во пракса. Нејзината посветеност гарантира дека секој чекор од процесот е добро испланиран и структурирано извршен.',
    },
    tags: ['Graphic Designer', 'Content Manager'],
    links: [
      { kind: 'instagram', href: 'https://www.instagram.com/minazdravevska/' },
      { kind: 'linkedin', href: 'https://www.linkedin.com/in/mina-zdravevska-4a2470386/' },
      { kind: 'email', href: 'mailto:minazdravevska@sivazona.mk' },
    ],
  },
  {
    id: 'game-testers',
    name: { en: 'Game Testers', mk: 'Тестери на играта' },
    role: { en: 'Testing', mk: 'Тестирање' },
    bio: {
      en: 'Our dedicated game testing team ensures the highest quality gaming experience through rigorous testing, bug finding and overall feedback.\n\nSpecial thanks to Kristijan Srbinoski, Nikola Shikole, Zafir Bogdanovikj, Andrej Zlatanov and Hristijan Petkovski.',
      mk: 'Нашиот посветен тим за тестирање на игри обезбеди искуство со играње со највисок квалитет преку ригорозно тестирање, откривање грешки и целокупни повратни информации.\n\nПосебна благодарност до Кристијан Србиноски, Никола Шиколе, Зафир Богдановиќ, Андреј Златанов и Христијан Петковски.',
    },
    tags: ['Game Testing', 'UX', 'Feedback'],
    links: [{ kind: 'github', href: 'https://github.com/ostaver' }],
  },
  {
    id: 'zafir-bogdanovikj',
    name: { en: 'Zafir Bogdanovikj', mk: 'Зафир Богдановиќ' },
    role: { en: 'Lead Game Tester', mk: 'Главен тестер на играта' },
    bio: {
      en: 'Zafir is the lead game tester behind GrayZone, responsible for testing the game throughout its development and helping the team identify bugs, gameplay issues, and areas for improvement. Through continuous testing and detailed feedback, he contributed to creating a smoother, more intuitive and engaging experience for players.',
      mk: 'Зафир е главен тестер на „Сива зона“, одговорен за тестирање на играта во текот на нејзиниот развој и идентификување технички недостатоци, проблеми во гејмплејот и можности за подобрување. Преку континуирано тестирање и детални повратни информации, придонесува кон создавање пофункционално, интуитивно и интересно искуство за играчите.',
    },
    tags: ['LeadGameTester', 'GameTesting', 'UX', 'Feedback'],
    links: [],
  },
];
