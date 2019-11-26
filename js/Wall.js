const BASEWIDTH = 37;
const BASEHEIGHT = 44;
const COLORS = ["white", "yellow", "red", "blue", "black"];
const SIZES = [1, 2, 3, 4, 6];
const DURATION_NORMAL = 100;
const DURATION_MOBILE = 10;
const SKIP_ROW_NORMAL = 2;
const SKIP_ROW_MOBILE = 0;

class Wall {

    constructor (target, links = {}) {
        this.target = target;
        this.links = links;
        this.links.set('mobile0', new Link("javascript:window.wall.toggle();;", "toggle", "", 4, - 2));
        if (this.target.css('display') != 'none') {
            this.initialize();
        }
    }

    initialize () {
        clearTimeout(this.iteration);
        this.target.empty();
        this.target.css('left', 0);
        this.duration = this.isMobile() ? DURATION_MOBILE : DURATION_NORMAL;
        this.tail = this.isMobile() ? SKIP_ROW_MOBILE : SKIP_ROW_NORMAL;
        // Calculate bounds
        this.width = Math.floor(this.target.width() / BASEWIDTH + 1);
        // TODO: adapt depending on device "profile"
        this.height = Math.floor(this.target.height() / BASEHEIGHT + 1) - this.tail;
        this.startx = Math.floor(this.target.width() - (this.width * BASEWIDTH));
        this.starty = 0;
        //
        this.rows = [];
        for (var i = 0; i < this.height; i++) {
            this.rows.push(new Row(this.width + (i == 0 && this.isMobile() ? 2 : 0), i));

        }
        for (let key of this.links.keys()) {
            if (typeof key == "string" && key.startsWith('mobile')) {
                if (this.isMobile()) {
                    var link = this.links.get(key);
                    link.setX((link.x + this.width) % this.width);
                    link.setY(parseInt(key.substr('mobile'.length)) < 0 ? this.height - 1 + parseInt(key.substr('mobile'.length)) : parseInt(key.substr('mobile'.length)));
                    this.rows[link.y].setBlocks([link]);
                }
            } else {
                var link = this.links.get(key);
                link.setX((link.x + this.width) % this.width);
                link.setY(key < 0 ? this.height - 1 + key : key);
                this.rows[link.y].setBlocks([link]);
            }
        }
        this.index = 0;
        this.row = this.rows[this.index];
        this.iteration = setTimeout(function() {window.wall.next();}, this.duration);
    }

    next () {
        this.target.append(this.row.nextBlock().element(this));
        if (this.row.isFull()) {
            if (this.index < (this.height - 1)) {
                this.row = this.rows[++this.index];
                this.iteration = setTimeout(function() {window.wall.next();}, this.duration);
            } else {
                if (this.isMobile()) {
                    this.toggle();
                }
            }
        } else {
            this.iteration = setTimeout(function() {window.wall.next();}, this.duration);
        }
    }

    isMobile () {
        return $(window).width() <= 768;
    }

    toggle() {
        if (parseInt(this.target.css('left'), 10) != 0) {
            this.target.animate({left: 0}, 500);
        } else {
            this.target.animate({left: '-100%'}, 500);
        }
    }

    static getMillis () {
        return new Date().getTime();
    }

    resize() {
        if (this.target.css('display') != 'none') {
            this.lock = Wall.getMillis() + 500;
            this.iteration = setTimeout(function () {
                window.wall.doResize();
            }, 500);
        }
    }

    doResize () {
        if (this.lock != null && Wall.getMillis() >= this.lock) {
            this.lock = null;
            this.initialize();
        }
    }
}

class Block {

    constructor(color, size, x, y) {
        this.color = color;
        this.size = size;
        this.x = x;
        this.y = y;
    }

    element(wall) {
        return $( '<div>')
            .addClass('block')
            .addClass(this.color + this.size)
            .css('left', wall.startx + this.x * BASEWIDTH)
            .css('bottom', wall.starty + this.y * BASEHEIGHT)
            .css('z-index', 10 + this.y);
    }
}

class Link extends Block {

    constructor(href, classname, text, size, x, y = null) {
        super(null, size, x, y);
        this.href = href;
        this.classname = classname;
        this.text = text;
    }

    setX (x) {
        this.x = x;
        return this;
    }

    setY (y) {
        this.y = y;
        return this;
    }

    element(wall) {
        return $( '<a>')
            .addClass('block')
            .addClass(this.classname)
            .css('left', wall.startx + this.x * BASEWIDTH)
            .css('bottom', wall.starty + this.y * BASEHEIGHT)
            .css('z-index', 10 + this.y)
            .attr("href", this.href)
            .attr("title", this.text)
            .text(this.text);
    }
}

class Row {

    constructor (size, y, blocks = []) {
        this.size = size;
        this.y = y;
        this.intervals = [new Interval(0, this.size - 1)];
        this.blocks = blocks;
    }

    setBlocks (blocks) {
        this.blocks = blocks;
    }

    insert(block) {
        for (var index in this.intervals) {
            if (block.x >= this.intervals[index].from
                && (block.x + block.size - 1) <= this.intervals[index].to
            ) {
                var inserts = this.intervals[index].insert(block);
                this.intervals.splice(index, 1);
                for (let interval of inserts) {
                    this.intervals.splice(index++, 0, interval);
                }
                break;
            }
        }
    }

    nextBlock () {
        if (this.occupied().length < this.blocks.length) {
            var block = this.blocks[this.occupied().length];
        } else {
            var slots = this.slots();
            var i = Math.floor(Math.random() * slots.length);
            var sizes = [];
            for (var index in SIZES) {
                if (SIZES[index] <= slots[i].size()) {
                    sizes.push(SIZES[index]);
                }
            }
            var s = sizes[Math.floor(Math.random() * sizes.length)];
            var block = new Block(
                COLORS[Math.floor(Math.random() * COLORS.length)],
                s,
                slots[i].from + Math.floor(Math.random() * (slots[i].size() - s)),
                this.y);
        }
        this.insert(block);
        return block;
    }

    occupied () {
        var occupied = [];
        for (let interval of this.intervals) {
            if (!interval.isEmpty()) {
                occupied.push(interval);
            }
        }
        return occupied;
    }

    slots () {
        var slots = [];
        for (let interval of this.intervals) {
            if (interval.isEmpty()) {
                slots.push(interval);
            }
        }
        return slots;
    }

    isEmpty () {
        return this.intervals.length == 1 && this.intervals[0].isEmpty();
    }

    isFull () {
        for (let interval of this.intervals) {
            if (interval.isEmpty()) {
                return false;
            }
        }

        return true;
    }
}

/**
 * Defines an interval from (included) -> to (included)
 */
class Interval {

    constructor(from, to, block = null) {
        this.from = from;
        this.to = to;
        this.block = block;
    }

    insert (block) {
        var intervals = [];
        if (this.from != block.x) {
            intervals.push(new Interval(this.from, block.x - 1));
        }
        intervals.push(new Interval(block.x, block.x + block.size - 1, block));
        if (this.to != (block.x + block.size - 1)) {
            intervals.push(new Interval(block.x + block.size, this.to));
        }
        return intervals;
    }

    size() {
        return this.to - this.from + 1;
    }

    isEmpty(){
        return this.block == null;
    }

    intersect(interval){
        return (this.from >= interval.from && this.from <= interval.to) || (this.to >= interval.from && this.to <= interval.to);
    }

    contains(interval){
        return (this.from <= interval.from && this.to >= interval.to);
    }
}





/*
     FILE ARCHIVED ON 14:40:29 Feb 16, 2019 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 13:59:59 Nov 26, 2019.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  exclusion.robots.policy: 0.126
  captures_list: 193.522
  RedisCDXSource: 20.247
  PetaboxLoader3.resolve: 281.325 (3)
  LoadShardBlock: 157.524 (3)
  exclusion.robots: 0.136
  load_resource: 292.817
  CDXLines.iter: 12.644 (3)
  esindex: 0.016
  PetaboxLoader3.datanode: 110.643 (5)
*/