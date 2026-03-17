import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        return [
            getCreatureDescription(this),
            ...super.getDescriptions()
        ];
    }
}

class Duck extends Creature {
    constructor() {
        super('Мирная утка', 2);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor() {
        super('Пес-бандит', 3);
    }
}

class Trasher extends Dog {
    constructor() {
        super();
        this.name = 'Громила';
        this.maxPower = 5;
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            continuation(Math.max(value - 1, 0));
        });
    }

    getDescriptions() {
        const baseDescriptions = super.getDescriptions();
        return ['Получает на 1 урона меньше', ...baseDescriptions];
    }
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const { oppositePlayer } = gameContext;

        for (const card of gameContext.oppositePlayer.table) {
            if (card) {
                taskQueue.push(onDone => this.dealDamageToCreature(2, card, gameContext, onDone));
            }
        }

        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor() {
        super();
        this.name = 'Браток';
        this.maxPower = this.currentPower = 2;
        this.updateView();
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        this.constructor.setInGameCount(this.constructor.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        this.constructor.setInGameCount(this.constructor.getInGameCount() - 1);
        continuation();
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + this.constructor.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(Math.max(0, value - this.constructor.getBonus()));
    }

    getDescriptions() {
        return [
            'Чем их больше, тем они сильнее',
            ...super.getDescriptions()
        ];
    }
}

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Gatling(),
];
const banditStartDeck = [
    new Trasher(),
    new Dog(),
    new Dog(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});