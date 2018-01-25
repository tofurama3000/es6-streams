import 'babel-polyfill'
import chai from 'chai'
import Stream from '../src/stream'
const expect = chai.expect

describe('Data Producer', function() {
  describe('No Source', function() {
    it('should return an empty array', function() {
      const data = []
      let stream = new Stream()
      expect([]).to.deep.equal(data)
    })

    const data = [1,2,3,4]
    it('should pull from generator', function() {
      let stream = new Stream()
      stream.next(function*(){
        yield* data
      })
      expect([...stream]).to.deep.equal(data)
    })

    it('should chain generators', function() {
      let stream = new Stream()
      stream.next(function*(){
        yield* data
      }).next(function*(){
        let x = null
        while (true) {
          x = yield (x ? x * x : 0)
        }
      })
      expect([...stream]).to.deep.equal(data.map(x => x * x))
    })

    it('should handle returns', function() {
      let stream = new Stream()
      stream.next(function*(){
        yield* data
      }).next(function*(){
        return
      })
      expect([...stream]).to.deep.equal([])
    })
  })

  describe('Single Source', function() {
    const data = [1,2,3,4]
    it('should forward all data', function() {
      let stream = new Stream(data)
      expect([...stream]).to.deep.equal(data)
    })

    it('should forward to generator', function() {
      let stream = new Stream(data)
      stream.next(function*(){
        let x = null
        while(true) {
          x = yield (x ? x * x : 0)
        }
      })
      expect([...stream]).to.deep.equal(data.map(x => x * x))
    })

    it('should chain generators', function() {
      let stream = new Stream(data)
      stream.next(function*(){
        let x = null
        while(true) {
          x = yield (x ? x * x : 0)
        }
      }).next(function*(){
        let x = null
        while(true){
          x = yield (x ? x + 1 : 0)
        }
      })
      expect([...stream]).to.deep.equal(data.map(x => x * x + 1))
    })

    it('should handle returns after yield', function() {
      let stream = new Stream(data)
      stream.next(function*(){
        let x = null
        while(true) {
          x = yield (x ? x * x : 0)
        }
      }).next(function*(){
        let x = null
        while(true){
          x = yield (x ? x + 1 : 0)
        }
      }).next(function*(){
        yield
        return 5
      })
      expect([...stream]).to.deep.equal([])
    })

    it('should handle returns before yield', function() {
      let stream = new Stream(data)
      stream.next(function*(){
        let x = null
        while(true) {
          x = yield (x ? x * x : 0)
        }
      }).next(function*(){
        let x = null
        while(true){
          x = yield (x ? x + 1 : 0)
        }
      }).next(function*(){
        return 5
      })
      expect([...stream]).to.deep.equal([])
    })
  })
})