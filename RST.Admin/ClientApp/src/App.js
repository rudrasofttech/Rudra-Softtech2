import React, { Component } from 'react';
import { Route } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { FetchData } from './components/FetchData';
import { Counter } from './components/Counter';
import { CustomPageList } from './components/CustomPageList';
import { LoginForm } from './components/LoginForm';
import { ArticleList } from './components/ArticleList';
import { CustomDataSourceList } from './components/CustomDataSourceList';
import { CategoryList } from './components/CategoryList';
import { MemberList } from './components/MemberList';
import { WebsiteSettings } from './components/WebsiteSettings';
import { CustomPageManage } from './components/CustomPageManage';
import { ArticleManage } from './components/ArticleManage';
import { DataSourceManage } from './components/DataSourceManage';
export default class App extends Component {
    displayName = App.name

    render() {
        return (
            <Layout>
                <Route exact path='/' component={Home} />
                <Route path='/counter' component={Counter} />
                <Route path='/fetchdata' component={FetchData} />
                <Route path='/custompagelist' component={CustomPageList} />
                <Route path='/LoginForm' component={LoginForm} />
                <Route path='/articlelist' component={ArticleList} />
                <Route path='/CustomDataSourceList' component={CustomDataSourceList} />
                <Route path='/CategoryList' component={CategoryList} />
                <Route path='/MemberList' component={MemberList} />
                <Route path='/WebsiteSettings' component={WebsiteSettings} />
                <Route path='/CustomPageManage/:ID' component={CustomPageManage} />
                <Route path='/ArticleManage/:ID' component={ArticleManage} />
                <Route path='/DataSourceManage/:ID' component={DataSourceManage} />
            </Layout>
        );
    }
}
