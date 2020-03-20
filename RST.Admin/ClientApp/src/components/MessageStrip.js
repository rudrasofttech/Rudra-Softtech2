import React, { Component } from 'react';
import { Alert, Button } from 'react-bootstrap';

export class MessageStrip extends Component {


    constructor(props) {
        super(props);

        //this.state = { show: true, message: props.message, bsstyle: props.bsstyle };

        //this.handleDismiss = this.handleDismiss.bind(this);
    }


    //componentDidMount() {
    //    if (this.state.show) {
    //        setTimeout(this.handleDismiss, 5000);
    //    }
    //}

    //handleDismiss() {
    //    this.setState({ show: false });
    //}
    render() {
        if (this.props.message) {
            return (
                <Alert className="noMargin noRadius" bsStyle={this.props.bsstyle}>
                    <p>
                        {this.props.message}
                    </p>

                </Alert>
            );
        } else {
            return (
                <span />
            );
        }
    }
}