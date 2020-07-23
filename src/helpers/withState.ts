/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import { Request } from 'express'
import { set, get } from 'lodash'
import { Transaction } from 'sequelize'
import db from '../models/_instance'
import getterObject from './getterObject'

class withState {
  private req: Request

  constructor(req: Request) {
    this.req = req
    this.req.setState = this.setState.bind(this)
    this.req.setFieldState = this.setFieldState.bind(this)
    this.req.getState = this.getState.bind(this)
    this.req.getBody = this.getBody.bind(this)
    this.req.setBody = this.setBody.bind(this)
    // this.req.getSingleArrayFile = this.getSingleArrayFile.bind(this)
    this.req.getTransaction = this.getTransaction.bind(this)
    this.req.rollbackTransactions = this.rollbackTransactions.bind(this)
    this.req._transaction = {}
  }

  setState(val: object) {
    this.req.state = {
      ...(this.req.state || {}),
      ...val,
    }
  }

  setBody(obj: object) {
    this.req.body = {
      ...this.req.body,
      ...obj,
    }
  }

  setFieldState(key: any, val: any) {
    set(this.req.state, key, val)
  }

  getState(path: any, defaultValue?: any): any {
    return get(this.req.state, path, defaultValue)
  }

  getBody(path?: any, defaultValue?: any): any {
    return getterObject(this.req.body, path, defaultValue)
  }

  // getSingleArrayFile(name: string) {
  //   const data = (getterObject(
  //     this.req,
  //     ['files', name, '0'].join('.')
  //   ) as unknown) as Express.Multer.File
  //   if (data) {
  //     return data.filename
  //   }
  // }

  async getTransaction(id?: any): Promise<Transaction> {
    id = id === undefined ? 1 : id
    const txn = this.req._transaction[id]
    if (txn) {
      return txn
    }
    const newTxn = await db.sequelize.transaction()
    this.req._transaction[id] = newTxn
    return newTxn
  }

  async rollbackTransactions() {
    const { _transaction } = this.req

    const entryTransactions = Object.entries(_transaction)

    for (let i = 0; i < entryTransactions.length; i += 1) {
      const [, value] = entryTransactions[i] as [any, Transaction]
      // eslint-disable-next-line no-await-in-loop
      await value.rollback()
    }
  }
}

export default withState