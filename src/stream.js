
export default class Stream {

    // Creates a stream with optional iterable data
    constructor(data) {
        this.data = data
        this.gen = []
        this.funcs = []
    }

    // Adds a generator to the chain
    next(generator) {
        this.gen.push(generator)
        return this
    }

    sort(func) {
        this.funcs.push({
            type: 'sort',
            func
        })
        return this
    }

    map(func) {
        if (!func instanceof Function)
            throw 'Invalid input, expected a function!'
        this.funcs.push({
            type: 'map',
            func
        })
        return this
    }

    reverse() {
        this.funcs.push({
            type: 'reverse'
        })
    }

    filter(func) {
        if (!func instanceof Function)
            throw 'Invalid input, expected a function!'
        this.funcs.push({
            type: 'filter',
            func
        })
        return this
    }

    collectRight(func, start=undefined){
        const arr = this.__$doActions([...this])
        if (func) {
            return arr.reduceRight(func, start)
        }
        return arr
    }

    collect(func, start=undefined){
        const arr = this.__$doActions([...this])
        if (func) {
            return arr.reduce(func, start)
        }
        return arr
    }

    do(){
        this.collect()
    }

    __$doActions(arr) {
        this.funcs.forEach(funcMeta => {
            switch(funcMeta.type) {
            case 'filter':
                return arr = arr.filter(funcMeta.func)
            case 'reverse':
                return arr = arr.reverse()
            case 'map':
                return arr = arr.map(funcMeta.func)
            case 'sort':
                return arr = arr.sort(funcMeta.func)
            }
        })
    }


    // Internal process generoator
    *__$process() {
        const gens = this.gen.map(g => g())
        let loop = true
        gens.forEach((g, index) => index ? loop = !g.next().done : undefined)
        let prevData = undefined
        let yieldStarResult
        try {
            while (loop) {
                let item = null
                for (let index in gens) {
                    const g = gens[index]
                    if (loop)
                        item = g.next(prevData)
                    else
                        item = g.return(prevData)
                    prevData = item.value
                    if (item.done) {
                        yieldStarResult = prevData
                        loop = false
                    }
                }
                if (loop) {
                    prevData = yield prevData
                }
            }
        } catch (e) {
            for (let index in gens) {
                const g = gens[index]
                g.throw(e)
            }
        } finally {
            for (let index in gens) {
                const g = gens[index]
                yieldStarResult = g.return(yieldStarResult)
            }
        }
        return yieldStarResult
    }

    // the iterator symbol generator
    *[Symbol.iterator]() {
        if (this.data) {
            const gen = this.__$process()
            gen.next()
            for (let d in this.data) {
                let item = gen.next(this.data[d])
                if (item.done)
                    return item.value
                yield item.value
            }
        } else {
            const gen = this.__$process()
            yield* gen
        }
    }
}