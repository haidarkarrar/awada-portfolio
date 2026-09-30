import { galleryImages } from './gallery-images.js';

const cdn = 'https://cdn.myportfolio.com/00baf04e-95a1-4aad-81ad-bc79fb37cbc0/';

export const logo = `${cdn}717f06c0-55e2-4475-8496-ebd981381591_rwc_0x0x4500x4500x4096.png?h=00191cd773c67746908f4268f890dca4`;
export const splashArtwork = `${cdn}e37c4483-b56c-4148-a7a1-a1b7337be61a_rwc_0x0x4500x4500x4096.png?h=8a3beedebd29f22c59c24bfc1c2216ab`;

export const sections = [
  {
    slug: 'talking-head',
    title: 'Talking head',
    year: '2025',
    kind: 'reels',
    cover: `${cdn}9ad3569c-dcf2-45b2-92ba-3b3f570fb63c_rwc_0x0x1916x1080x1916.jpg?h=1bd0496ac4b79ad5edfd855721c5e5cf`,
  },
  {
    slug: 'reels',
    title: 'Reels',
    year: '2025',
    kind: 'reels',
    cover: `${cdn}514bf9b8-3fbf-4b5f-a96e-4fcd12df7934_rwc_0x0x1916x1080x1916.jpg?h=65560aa8a3da4ac256839731690b9247`,
  },
  {
    slug: 'branding',
    title: 'Branding & Logo',
    year: '2024',
    kind: 'gallery',
    cover: `${cdn}6a94bf01-ac5a-4dfe-8316-8ae739e5af59_car_16x9.jpg?h=885392164b0329dc9d9a3b7e40bcf955`,
  },
  {
    slug: 'video-editing',
    title: 'Video editing',
    year: '2024',
    kind: 'reels',
    cover: `${cdn}6b53bd97-287b-4e55-a413-73e1435f218e_car_16x9.jpg?h=eb7d1b4ad0d1e66c2435b3f8fa959225`,
  },
  {
    slug: 'socail-media-post',
    title: 'Social Media',
    year: '2024',
    kind: 'gallery',
    cover: `${cdn}f5be097f-1b2c-4a5b-a620-6617e8ec6486_car_16x9.jpg?h=02f803bce966970906e49bff407247bb`,
  },
];

const adobePlayers = {
  'talking-head': [
    'KjbZ5UnpLGw', 'DwPJ5dgwCZm', '7jZQECPAThI', '-z8R3rBktAh', 'MCnP_Qvjb7e',
    'ETQK9Qaxfu7', 'K-PyMGfyTsG', '4oxFpQfbog5', 'H292ETiV3KU', 'BVRgD_qZw6f',
    '-QybysxmtyR', 'A54M4and4fb', 'UfknzoG9K_p', '-4RZ7Hyt9tc', 'CNYDDtNTfkI',
    'EqzUfKugcbz', 'QKXVvW8K4wP', 'GA3RtQHDfLe', '4cvv26SUTNF', 'QvV67T9WSZb',
  ],
  reels: [
    '4pGgNIvP8BL', '9wLxwPZa6G6', '7k-hv8nzTmB', 'SInN8gsq_Is', '2uvuAxmoDxm',
    'FjP-7XRe6Zn', 'UfjdEeBW4YI', 'FxCoZv37tj7', 'EEyww5RfebT', 'E94DKMYooPB',
    'W54xriCSyXK', 'LYI7r6qgCPR', 'EIC5zxm3QpA', 'W7_iNfUUjjK', '9oALcbFZD6T',
    'Dos9-tFotXK', 'WTSwcsyB89L', 'RtYqu_XP-Ye', 'AsR_XEdnzXs', 'UdeETqq-9ug',
    'WLA53zVXbT4', 'Urg3naDGRch', 'ADqTtwfAEzv', 'Nz9Afc_Myp6', 'K6j5DFAdkSN',
  ],
  'video-editing': [
    'EfTfIagKU2h', '3TvdjbTHXY9', 'G9A4T4eLpJH', 'UZanUB-N7Vw', 'E5Aq2HrnERo',
    'GEdH26BhdIC', 'NCTMA34kSYg', 'BFqs5HPqbWP', 'Em7vdyJ3L5K', 'QRQauP8BsF5',
    'W3ozFEFFJUI', '-DgqRBFbgU2', 'PvWG3x8UJ6m', 'U7v9w7xcJBw', 'Tc8uYa3SEiS',
    'R6DfhuSSeF3', '2k9HvX6tryy', 'LIpT7dHkfIY', 'LVzJ77cjfw9', 'SfpfUnJA7Um',
    'S6F-uLi5YTz', 'PRC8LoAKAK5', 'KjnvEz4u8ut', 'HpURcdDyhtv', 'HIiBa2EAy7c',
    'PK58GFgzcZC', 'AEWqrkVBTP7', '-n2uYjV7gZ8', '5CHuBuDGpun',
  ],
};

export const previewMedia = Object.fromEntries(sections.map((section) => {
  if (adobePlayers[section.slug]) {
    return [section.slug, adobePlayers[section.slug].map((playerId, index) => ({
      id: `preview-${section.slug}-${index + 1}`,
      name: `${section.title} ${String(index + 1).padStart(2, '0')}`,
      type: 'video',
      previewUrl: section.cover,
      embedUrl: `https://www-ccv.adobe.io/v1/player/ccv/${playerId}/embed?bgcolor=%23191919&lazyLoading=true&api_key=BehancePro2View`,
    }))];
  }

  const images = galleryImages[section.slug] || [];
  return [section.slug, images.map((image, index) => ({
    id: `preview-${section.slug}-${index + 1}`,
    name: `${section.title} ${String(index + 1).padStart(2, '0')}`,
    type: 'image',
    previewUrl: image.thumbnailUrl,
    contentUrl: image.contentUrl,
    thumbnailUrl: image.thumbnailUrl,
  }))];
}));

export const about = {
  intro: [
    'I am a passionate graphic designer, video editor, and photographer with years of experience in visual storytelling, branding, and motion graphics. My expertise lies in creating engaging content that captivates audiences, whether through stunning designs, dynamic videos, or high-quality photography.',
    'With a deep understanding of Adobe Creative Suite, 3D design, and post-production techniques, I bring creativity and precision to every project. I thrive in fast-paced environments, adapting quickly to new challenges while delivering high-quality, impactful visuals.',
    'I believe in the power of design to tell stories, evoke emotions, and leave lasting impressions. My goal is to collaborate with forward-thinking brands and individuals to bring their visions to life through creativity and innovation.',
    'Let’s create something extraordinary together!',
  ],
  experience: [
    {
      role: 'Social Media Graphic Designer & Post-Production Editor / Videographer',
      company: 'Sahat TV',
      date: '2025 — Present',
      description: '',
    },
    {
      role: 'Graphic Designer & Post-Production Editor',
      company: 'Digitality MENA',
      date: '2023 — 2024',
      description: 'At Spirral Media, I develop high-quality visual concepts and design engaging marketing materials such as advertisements, social media content, and promotional graphics. My role involves motion graphics creation and video post-production, where I manage raw footage, enhance visuals with special effects, and refine final outputs to ensure a professional and polished look. My ability to craft eye-catching motion graphics has contributed to creating impactful brand identities and effective marketing campaigns.',
    },
    {
      role: 'Graphic Designer & Post-Production Editor',
      company: 'Spirral Media',
      date: '2023 — 2024',
      description: 'At Spirral Media, I develop high-quality visual concepts and design engaging marketing materials such as advertisements, social media content, and promotional graphics. My role involves motion graphics creation and video post-production, where I manage raw footage, enhance visuals with special effects, and refine final outputs to ensure a professional and polished look. My ability to craft eye-catching motion graphics has contributed to creating impactful brand identities and effective marketing campaigns.',
    },
    {
      role: 'Motion Graphics & Visual Effects Editor',
      company: 'Asia News',
      date: '2022 — 2024',
      description: 'Working with Asia News, I was responsible for producing compelling motion graphics and visual effects to enhance news segments and social media content. My expertise in 3D navigation and animation helped create dynamic graphics that effectively delivered key messages to the audience. Additionally, I worked on eliminating unwanted elements from footage, improving video quality, and ensuring smooth storytelling through seamless visual effects.',
    },
    {
      role: 'Motion Graphics & Visual Effects Editor',
      company: 'Committee for the Defense of Human Rights',
      date: '2022 — 2023',
      description: 'As part of the Committee for the Defense of Human Rights, I specialized in creating social impact-driven motion graphics for awareness campaigns. I designed visually striking animations to support human rights initiatives, making complex information more accessible and engaging. My role also involved video editing and object removal, ensuring smooth and professional final outputs that aligned with the organization’s message.',
    },
    {
      role: 'Freelance Graphic Designer & Photographer',
      company: 'Independent',
      date: '2019 — Present',
      description: 'As a freelance designer and photographer, I have worked with a diverse range of clients to develop unique branding solutions and stunning visual content. My work includes designing logos, flyers, brochures, and posters, as well as capturing high-quality images for businesses and personal projects. I collaborate closely with clients to understand their vision and translate it into compelling visual storytelling, delivering results that enhance brand recognition and engagement.',
    },
    {
      role: 'Photographer & News Publisher',
      company: 'Islamic Action Front',
      date: '2019',
      description: 'During my time at the Islamic Action Front, I played a key role in news photography and content publishing. I captured critical moments for news reports, ensuring visually compelling and authentic storytelling. In addition, I helped manage editorial direction, overseeing content creation and publication for newspapers and digital media platforms. My work contributed to maintaining the organization’s credibility and reach through engaging and informative visual content.',
    },
    {
      role: 'Filming & Editing',
      company: 'Sada Dahyeh',
      date: '2017 — 2019',
      description: 'As a video editor and filmmaker for Sada Dahyeh, I handled all aspects of post-production, from video sequencing and color grading to sound design and special effects. I ensured seamless transitions and logical storytelling in every project, working on promotional videos, interviews, and documentary-style content. My work required a keen eye for detail, creativity, and a strong understanding of narrative flow to create engaging visual content.',
    },
    {
      role: 'Photographer & Videographer',
      company: 'Karim Films',
      date: '2015 — 2017',
      description: 'At Karim Films, I was involved in end-to-end media production, from planning and filming to final editing. I operated high-end cameras and production equipment, ensuring professional-quality visuals for corporate, commercial, and artistic projects. My expertise in lighting, composition, and cinematography helped produce engaging visual narratives that aligned with each project’s goals. My ability to deliver creative, high-impact content made me a valuable asset to the production team.',
    },
  ],
  skills: [
    ['Design & Editing', 'Adobe Photoshop, Illustrator, After Effects, Premiere Pro'],
    ['3D & Motion Graphics', '3ds Max (Basics), Cinema 4D (Basics), V-Ray'],
    ['Photography & Videography', 'Professional photography, video editing, post-production'],
    ['Creativity', 'Brand marketing, visual storytelling, content creation'],
    ['Professional Skills', 'Communication, adaptability, retail strategy, business management'],
  ],
};
