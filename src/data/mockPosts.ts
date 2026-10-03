import { type Post } from '../lib/postsApi';
import sampleImage1 from './resized/sample_image1.jpg';
import sampleImage2 from './resized/sample_image2.jpg';
import sampleImage3 from './resized/sample_image3.jpg';
import sampleImage4 from './resized/sample_image4.jpg';
import sampleImage5 from './resized/sample_image5.jpg';
import sampleImage6 from './resized/sample_image6.jpg';
import sampleImage7 from './resized/sample_image7.jpg';
import sampleImage8 from './resized/sample_image8.jpg';
import sampleImage9 from './resized/sample_image9.jpg';
import sampleImage10 from './resized/sample_image10.jpg';

// デモ用の投稿。地点は八王子・日野・多摩・稲城あたりで、地図の「上位 10%」のタイルの光っている塊（クラスター）の上に置いた
// （塊の重心に一番近い光っている画素。2026-10-03 に public/NightViewPotential_top10_tiles の z14 から算出）。
// 地名は OpenStreetMap（Nominatim）の逆ジオコーディングによる町名。写真はサンプルで、その場所の写真ではない
export const MOCK_POSTS: Post[] = [
    {
        id: 'post-1',
        location: { lng: 139.27149, lat: 35.59615, placeName: '城山三丁目', area: '相模原市緑区' },
        caption: '丘の上から街の灯りが続いて見える。',
        photos: [{ url: sampleImage1 }],
        author: { id: 'user-1', name: 'KAZUNE' },
        createdAt: '2024-05-12T20:45:00+09:00',
    },
    {
        id: 'post-2',
        location: { lng: 139.50984, lat: 35.63013, placeName: '東長沼', area: '稲城市' },
        caption: '川沿いから向こう岸の灯りがきれい。',
        photos: [{ url: sampleImage2 }],
        author: { id: 'user-2', name: 'MIO' },
        createdAt: '2024-04-02T19:10:00+09:00',
    },
    {
        id: 'post-3',
        location: { lng: 139.34805, lat: 35.67428, placeName: '大谷町', area: '八王子市' },
        caption: '住宅街の坂の上、夜景が広がる。',
        photos: [{ url: sampleImage3 }],
        author: { id: 'user-3', name: 'RYO' },
        createdAt: '2024-03-18T21:05:00+09:00',
    },
    {
        id: 'post-4',
        location: { lng: 139.395, lat: 35.64757, placeName: '南平', area: '日野市' },
        caption: '高台から多摩の灯りを一望。',
        photos: [{ url: sampleImage4 }],
        author: { id: 'user-4', name: 'SORA' },
        createdAt: '2024-02-24T18:30:00+09:00',
    },
    {
        id: 'post-5',
        location: { lng: 139.30849, lat: 35.69233, placeName: '犬目町', area: '八王子市' },
        caption: '静かな夜景で落ち着く。',
        photos: [{ url: sampleImage5 }],
        author: { id: 'user-5', name: 'HARU' },
        createdAt: '2024-02-10T20:15:00+09:00',
    },
    {
        id: 'post-6',
        location: { lng: 139.28857, lat: 35.71352, placeName: '牛沼', area: 'あきる野市' },
        caption: '街道沿いの灯りがやわらかい。',
        photos: [{ url: sampleImage6 }],
        author: { id: 'user-6', name: 'MEI' },
        createdAt: '2024-01-28T19:40:00+09:00',
    },
    {
        id: 'post-7',
        location: { lng: 139.40153, lat: 35.63376, placeName: '東山（多摩ニュータウン）', area: '八王子市' },
        caption: 'ニュータウンの灯りが重なって見える。',
        photos: [{ url: sampleImage7 }],
        author: { id: 'user-7', name: 'REN' },
        createdAt: '2024-01-12T21:20:00+09:00',
    },
    {
        id: 'post-8',
        location: { lng: 139.39758, lat: 35.67469, placeName: '神明', area: '日野市' },
        caption: '夕景から夜景まで見渡せる。',
        photos: [{ url: sampleImage8 }],
        author: { id: 'user-8', name: 'AI' },
        createdAt: '2023-12-22T18:55:00+09:00',
    },
    {
        id: 'post-9',
        location: { lng: 139.35209, lat: 35.69261, placeName: '丸山町', area: '八王子市' },
        caption: '夜の散歩にちょうどいい。',
        photos: [{ url: sampleImage9 }],
        author: { id: 'user-9', name: 'KENTO' },
        createdAt: '2023-12-08T19:05:00+09:00',
    },
    {
        id: 'post-10',
        location: { lng: 139.29201, lat: 35.66263, placeName: '元八王子町', area: '八王子市' },
        caption: '山の空気と夜景が最高。',
        photos: [{ url: sampleImage10 }],
        author: { id: 'user-10', name: 'NANA' },
        createdAt: '2023-11-26T20:10:00+09:00',
    },
];
