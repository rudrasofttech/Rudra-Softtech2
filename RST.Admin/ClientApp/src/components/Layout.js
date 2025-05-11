import React, { Component } from 'react';
import { Col, Grid, Row } from 'react-bootstrap';
import { NavMenu } from './NavMenu';

export class Layout extends Component {
    displayName = Layout.name

    render() {
        return (
            <Grid fluid>
                <Row>
                    <NavMenu />
                    <main role="main" class="col-md-9 ml-sm-auto col-lg-10 px-md-4">
                        {this.props.children}
                    </main>
                </Row>
            </Grid>
        );
    }
}
