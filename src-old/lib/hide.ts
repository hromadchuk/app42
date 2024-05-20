export const isHideMode = localStorage.getItem('hideMode') === 'ON';

interface IDemoUser {
    name: string;
    photoId: string;
    photo: string;
}

const hideUsers: Partial<IDemoUser>[] = [
    { name: 'Buzz Lightyear', photoId: 'buzz' },
    { name: 'EVE', photoId: 'eve' },
    { name: 'Forky', photoId: 'forky' },
    { name: 'Vanellope', photoId: 'vanellope' },
    { name: 'Mike Wazowski', photoId: 'mike' },
    { name: 'Nemo', photoId: 'nemo' },
    { name: 'Sheriff Woody', photoId: 'woody' },
    { name: 'WALL-E', photoId: 'walle' },
    { name: 'Ember Lumen', photoId: 'ember' },
    { name: 'Wade Ripple', photoId: 'wade' }
];

export async function getHideUser(userId: number) {
    const user = hideUsers[userId % hideUsers.length];

    user.photo = (await import(`../assets/hide_avatars/${user.photoId}.png`)).default as string;

    return user;
}
