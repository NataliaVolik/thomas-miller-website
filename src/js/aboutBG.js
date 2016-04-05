var root = this;

root.DotInfo = {
    BG: {}
}

// ==============================================
//
//
//		DOT
//
//
// ==============================================

var Dot = function(parent, position, velocity, scale, maxSpeed) {

    this.randS =  parseInt(randomNumber(1,4));

    this._parent = parent;
    this.ctx = this._parent.ctx;
    this.startScale = 0;
    this.scale = scale;
    this.radius = this.scale;
    this.opacity = parseInt(randomNumber(2,10)) / 10;
    this.maxSpeed = maxSpeed;
    this.rotation = randomNumber(0.5,1)/100;
    this.position = position;
    this.acceleration = Vector2D.create();
    this.velocity = velocity;
    this.maxForce = 0.2;
    this.wanderTheta = 0.005;
    this.setup();
};

Dot.prototype = {

    run: function() {
        this.update();
        this.draw();
    },

    setup: function() {
        var shape, color, randN;
        this.g = new PIXI.Graphics();

        if (this.randS === 1) {
            shape = "circle";
        } else if (this.randS === 2) {
            shape = "square";
        } else if (this.randS === 3) {
            shape = "cross";
        }
        randN = parseInt(randomNumber(0,2));
        color = randN === 1 ? "red" : "grey";
        this.g = PIXI.Sprite.fromImage("images/" + shape + "-" + color + ".png");
        this._parent.stage.addChild(this.g);
    },

    draw: function() {
        this.g.position.x = this.position[0];
        this.g.position.y = this.position[1];
        this.g.alpha = this.opacity;
        this.g.scale.x = this.startScale;
        this.g.scale.y = this.startScale;
        this.g.rotation += this.rotation;
    },

    update: function() {
        this.startScale += 0.05;
        if (this.startScale > this.scale) this.startScale = this.scale;
        if (this.scale < 0.5) this.startScale = 0;
        this.applyMovement();
    },

    applyMovement: function() {
        Vector2D.add(this.velocity, this.velocity, this.acceleration);
        Vector2D.limit(this.velocity, this.velocity, this.maxSpeed);
        Vector2D.add(this.position, this.position, this.velocity);
        Vector2D.mult(this.acceleration, this.acceleration, [0,0]);
    },

    seek: function(t, p) {
        var target = Vector2D.sub(t, t, p);
        return this.steer(target);
    },

    wander: function(r, d, c) {
        var circlePos, wanderTarget;
        // Wander radius
        var wanderR = r;
        // Wander distance
        var wanderD = d;
        // Wander change
        var wanderC = c;
        // Calculate the new location to steer towards the wander circle
        circlePos = Vector2D.clone(this.velocity);
        Vector2D.normalize(circlePos, circlePos);
        Vector2D.mult(circlePos, circlePos, [wanderD, wanderD]);
        Vector2D.add(circlePos, circlePos, this.position);
        // Wander random theta
        this.wanderTheta += Math.random() * (Math.floor(Math.random()*2) == wanderC ? wanderC : -wanderC) - (Math.floor(Math.random()*2) == wanderC ? wanderC : -wanderC) * .5;
        // Offset the wander theta
        wanderTarget = [Math.cos(this.wanderTheta) * wanderR, Math.sin(this.wanderTheta) * wanderR];
        Vector2D.add(wanderTarget, wanderTarget, circlePos);
        // seek the target destination
        return this.seek(wanderTarget, this.position);
    },

    steer: function (target) {
        var steer;
        var length = Vector2D.length(target, target);
        // normalize and scale vector
        Vector2D.normalize(target, target);
        Vector2D.mult(target, target, [this.maxSpeed,this.maxSpeed]);
        // calculate the steer force
        steer = target;
        Vector2D.sub(steer, steer, this.velocity);
        Vector2D.limit(steer, steer, this.maxForce);
        Vector2D.add(this.acceleration, this.acceleration, steer);
        return steer;
    },

    borders: function(width, height, radius) {
        if (this.position[0] < -radius) this.position[0] = width +radius;
        if (this.position[1] < -radius) this.position[1] = height +radius;
        if (this.position[0] > width +radius) this.position[0] = -radius;
        if (this.position[1] > height +radius) this.position[1] = -radius;
    }


};

// ==============================================
//
//
//		BG
//
//
// ==============================================

DotInfo.BG = QS.extend({

    container: "dot-info-bg",
    context: "2d",
    background: "0a0a1e",

    setup: function(args) {
        // create a renderer instance
        this.stage = new PIXI.Stage("0x" + this.background, true);
        // set the context and container
        this.ctx = PIXI.autoDetectRenderer(this.size[0], this.size[1], null, true);
        document.body.appendChild(this.ctx.view);
        // finally query the various pixel ratios
        var devicePixelRatio = window.devicePixelRatio || 1;
        var backingStoreRatio = this.ctx.view.webkitBackingStorePixelRatio || this.ctx.view.mozBackingStorePixelRatio || this.ctx.view.msBackingStorePixelRatio || this.ctx.oBackingStorePixelRatio || this.ctx.backingStorePixelRatio || 1;
        var ratio = devicePixelRatio / backingStoreRatio;
        // setup size and detect if we're retina
        this.ctx.view.width = this.size ? this.size[0] * ratio : 800 * ratio;
        this.ctx.view.height = this.size ? this.size[1] * ratio : 800 * ratio;

        this.attrs = args || {};
        this.dots = [];
        this.size = [window.innerWidth, window.innerHeight * 4];
        this.ctx.resize(window.innerWidth, window.innerHeight * 4);
        this.createDots();
        this.frameRate = 0;
    },

    update: function(data) {
        this.attrs.data = data;
    },

    draw: function() {
        for (var i = 0; i < this.dots.length; i++) {
            this.dots[i].run();
            this.dots[i].borders(this.size[0], this.size[1], this.dots[i].radius);
            this.dots[i].wander(randomNumber(3, 5), randomNumber(150, 300), randomNumber(-0.005, 0.005));
        };
    },

    createDots: function() {
        for (var i = 0; i < 325; i++) {
            var position = [
                randomNumber(0, window.innerWidth),
                randomNumber(0, window.innerHeight * 4)
            ];
            var velocity = Vector2D.create(randomNumber(-5, 5), randomNumber(-5, 5));
            var scale = randomNumber(0.1, 0.5);
            var maxSpeed = randomNumber(0.1,0.3);
            this.dots.push(new Dot(this, position, velocity, scale, maxSpeed));
        };
    },

    resize: function(e) {
        this.size = [window.innerWidth, window.innerHeight * 4];
        this.ctx.resize(window.innerWidth, window.innerHeight * 4);
    }

});


function randomNumber(min, max) {
    if (max == null) {
        max = min;
        min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
}

// WHEN LOADED START
onload = function() {
    root.dotInfoBG = new root.DotInfo.BG();
};