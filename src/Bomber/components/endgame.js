import VDOM from '../../core/dom.mjs';

export function createEndScreen(imageFileName) {
    return VDOM.createElement('div', { id: 'endScreen' },
        VDOM.createElement('div', { id: 'gameOverSide' },
            //imagefilename : soit gameover.svg ou youarethewinner.svg
            VDOM.createElement('img', { src: `../assets/${imageFileName}`, alt: '' })
        ),
        VDOM.createElement('div', { id: 'goBackHome', style: { fontFamily: "'Press Start 2P'", borderBottom: 'solid 2px' } },
            VDOM.createElement('p', {}, 'Go back home')
        )
    );
}

const endScreen = createEndScreen('gameover.svg');
