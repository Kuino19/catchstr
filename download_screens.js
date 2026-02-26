const fs = require('fs');
const https = require('https');
const path = require('path');

const screens = [
    { id: '3a8b1edf87f649fbba6a28893ea03e81', title: 'Football Talent Feed', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2JiYTk3OGU0MWY2OTRjOTJiOGJmNDkwNGIxYzM0Y2Q2EgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: '3e60a1ecd1be443c83297d139651c8c6', title: 'Football Talent Feed', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk2ZTY3MGYyNzQ5ZDQ0OTJhMmQ3YzA0ZTcyMTVmNGQxEgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: '4cfdec5398a94f5893807e7cba44d5ef', title: 'Football Talent Feed', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2M0OTAxYWUzZmQ2ZDQ4MTZhNDRiNTFjYTc1ZDRjYjU0EgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: '4f4ef2ff45034b1895598eb6c650a245', title: 'Networking Chat List', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU4ZGYwZjVhNWVlNTQ4MWRhMTA4ODJkMmEyMDQ4NzcxEgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: '53a50889cda6470da69273a3760b5b2a', title: 'catchstr Register Screen', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2JkNWU1NzNlNGMyNTRiZWVhNzE1NGQ4YjFlMzU2ODUxEgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: '573592c0ae994d6f9422b96cc800e0e3', title: 'catchstr Login Screen', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzA4NzM0ZTIwMWVjMTQyM2FiMWU4ZWIyMDhkYTk0NmMyEgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: '576a33a7961f4f14a3e3cd6c1e9e1f83', title: 'Football Talent Feed', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRmMmRlY2E4ZjI5NzQ0YmViZWQxNDM0ZTVmM2IwOTkzEgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: '79946e6894d6447f9394b6f8da5390d7', title: 'Player Profile & Stats', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2FlZjVkYWNhOTBlODRlYmRiZTI5MzcwMjc4MzcyNWY1EgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: 'bb8d484082aa4fe9a7b2cb0c009b0ccd', title: 'Football Talent Feed', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2M2YTliMjNiZjQwZTQwM2Q4NWFhZjlmYmMyZDE1MTBmEgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: 'c56ba18ed0dc425facfe2d1cee031533', title: 'Football Talent Feed', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2MyZGUwMzI2Y2Y0NzQ0Nzk5NWE0NzE2YWY5ZDdjYzUwEgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: 'd4cf459c78a5414683fc57d7d8b02ed8', title: 'Football Talent Feed', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2I5NDhiZjdjNzAzODQ0YzBiZTc5YTg4YTgwMGFkMjdkEgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: 'dfd05989375246948014d51498182751', title: 'Talent Discovery & Explore', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2UyMDMzOGQ3ZDM5NzRiM2I5OTA0ZWEzMTBhYTFjYjg4EgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: 'f0ca65ffe7a04238abb5ef3779791509', title: 'Football Talent Feed', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzhlYjRmZjk3YTUzMTRkYWI4NjdjMmMwYzA1ZmNjNjU1EgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' },
    { id: '69b096d96e1541058ac6c24965b03739', title: 'Football Talent Feed Prototype', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzc0NzI5NDFmMWQ0ZTQ4ZTRiOGQyNjY2ODFiNzdmZDg3EgsSBxC4rtiZ-hAYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTIwNDAxNzg1NTYwOTI5MzQzNQ&filename=&opi=89354086' }
];

const dir = path.join(__dirname, 'stitch_screens');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

screens.forEach(screen => {
    const filepath = path.join(dir, `${screen.title.replace(/\\s+/g, '_')}_${screen.id}.html`);
    https.get(screen.url, (response) => {
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
            fs.writeFileSync(filepath, rawData);
            console.log(`Downloaded ${screen.title}`);
        });
    });
});
