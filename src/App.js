import React from 'react';
import logo from './logo.svg';
import './App.css';
import * as RxDB from 'rxdb';
import { QueryChangeDetector } from 'rxdb';
import { schema } from './Schema';
import { ToastContainer, toast } from 'react-toastify';
// The following line is not needed for react-toastify v3, only for v2.2.1
//import 'react-toastify/dist/ReactToastify.min.css';
import * as moment from 'moment';

QueryChangeDetector.enableDebugging();

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));

const syncURL = 'http://localhost:5984/';
const dbName = 'chatdb';
class App extends React.Component {
  async createDatabase() {
    const db = await RxDB.create(
      {
        name: dbName,
        adapter: 'idb',
        password: '12345678',
        queryChangeDetection: true
      }
    )
    db.waitForLeadership().then(() => {
      document.title = '♛ ' + document.title;
    });
    const messagesCollection = await db.collection({
      name: 'messages',
      schema: schema
    });
    messagesCollection.sync({
      remote: syncURL + dbName + '/'
    });
    const replicationState = 
    messagesCollection.sync({ remote: syncURL + dbName + '/' });
    // triggered when a document is replicaated
    this.subs.push(
      replicationState.change$.subscribe(change => {
        toast('Replication change');
        console.dir(change)
      })
    );
    // emite each replicated doc
    this.subs.push(
    replicationState.docs$.subscribe(docData => console.dir(docData))
    );
    // true/false depending on whether the replication is running
    this.subs.push(
      replicationState.active$.subscribe(active => toast(`Replication active: ${active}`))
    );
    // true/valse on completion of replication
    this.subs.push(
      replicationState.complete$.subscribe(completed => toast(`Replication completed: ${completed}`))
    );
    // if error during replication
    this.subs.push(
      replicationState.error$.subscribe(error => {
        toast('Replication Error');
        console.dir(error)
      })
    );

    return db;
  }
  constructor(props) {
    super(props);
    this.state = {
      newMessage: '',
      messages: [],
    }
    this.subs = [];
    this.addMessage = this.addMessage.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
  }
  async componentDidMount() {
    this.db = await this.createDatabase();

    const subs = this.db.messages.find().sort({id: 1}).$.subscribe(messages => {
      if(!messages)
        return;
      toast('Reloading messages');
      this.setState({messages: messages});
    });
    this.subs.push(subs);
  }
  componentWillUnmount() {
    this.subs.forEach(sub => sub.unsubscribe());
  }
  renderMessages() {
    return this.state.messages.map(({id, message}) => {
      const date = moment(id, 'x').fromNow();
      return (
        <div key={id}>
          <p>{date}</p>
          <p>{message}</p>
          <hr/>
        </div>
      );
    });
  }
  handleMessageChange(event) {
    this.setState({newMessage: event.target.value});
  }
  async addMessage() {
    const id = Date.now().toString();
    const newMessage = {id, message: this.state.newMessage};
  
    await this.db.messages.insert(newMessage);
  
    this.setState({newMessage: ''});
  }
  //...
  render() {
    return (
      <div className="App">
      <ToastContainer autoClose={3000} />

      <div>{this.renderMessages()}</div>

      <div id="add-message-div">
        <h3>Add Message</h3>
        <input type="text" placeholder="Message" value={this.state.newMessage}
          onChange={this.handleMessageChange} />
        <button onClick={this.addMessage}>Add message</button>
      </div>
    </div>
    )
  }
}

export default App;
